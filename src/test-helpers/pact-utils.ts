import type {
  MessageProviders,
  MessageStateHandlers,
  PactMessageProviderOptions,
  VerifierOptions
} from '@pact-foundation/pact'
import type { ConsumerVersionSelector } from '@pact-foundation/pact-core'
import type {
  ProxyOptions,
  StateHandlers
} from '@pact-foundation/pact/src/dsl/verifier/proxy/types'
import { noOpRequestFilter } from './pact-request-filter'

// test the webhook failure at
// https://github.com/muratkeremozcan/pact-js-example-provider/actions/runs/11354888840/job/31583091638
process.env.PACT_PAYLOAD_URL =
  'https://ozcan.pactflow.io/pacts/provider/MoviesAPI/consumer/WebConsumer/pact-version/4002f4d5a3357b233a2dc3666d713f9136ec2088/metadata/Y3ZuPTM5NjIzMWMmdz10cnVl'

/**
 * Builds a `VerifierOptions` object for Pact verification, encapsulating
 * common provider test setup options, including conditional handling for
 * breaking changes and dynamically generated consumer version selectors.
 *
 * This function is designed to modularize the setup of Pact verification for providers
 * and streamline common configurations, such as state handlers, consumer version selectors,
 * and pact broker options.
 *
 * @param provider - The name of the provider being verified.
 * @param port - The port on which the provider service runs.
 * @param logLevel - (Optional) The log level for Pact verification output (`info`, `debug`, etc.).
 * @param stateHandlers - (Optional) Handlers to simulate provider states based on consumer expectations.
 * @param beforeEach - (Optional) A hook that runs before each consumer interaction.
 * @param afterEach - (Optional) A hook that runs after each consumer interaction.
 * @param includeMainAndDeployed - (Required) Flag indicating whether to include `mainBranch` and `deployedOrReleased` selectors. Should be explicitly controlled.
 * @param consumer - (Optional) A specific consumer to run verification for. If not provided, all consumers will be verified.
 * @param enablePending - (Optional, defaults to `false`) use this if breaking changes from a consumer somehow got in main, and the provider cannot release (allow blasphemy!)
 * @param requestFilter = (Optional) A custom request filter function to modify incoming requests (ex: auth).
 * @param publishVerificationResult - (Optional, defaults to `true`) Whether to publish the verification result to the Pact Broker.
 * @param pactBrokerToken - (Optional) Token for authentication with the Pact Broker, defaults to environment variable.
 * @param providerVersion - (Optional) The version of the provider, typically tied to a Git commit or build.
 * @param providerVersionBranch - (Optional) The branch of the provider being verified.
 * @param pactBrokerUrl - (Optional) URL of the Pact Broker, defaults to an environment variable.
 * @param pactPayloadUrl - (Optional) Direct URL for Pact payloads, typically used in CI environments.
 *
 * @returns A fully configured `VerifierOptions` object for running Pact verification tests.
 *
 * @example
 * // Running verification for all consumers
 * const options = buildVerifierOptions({
 *   provider: 'MoviesAPI',
 *   includeMainAndDeployed: process.env.PACT_BREAKING_CHANGE !== 'true'
 *   port: '3001',
 *   stateHandlers,
 * })
 *
 * @example
 * // Running verification for a specific consumer, with debug logging
 * const options = buildVerifierOptions({
 *   provider: 'MoviesAPI',
 *   consumer: 'WebConsumer'
 *   includeMainAndDeployed: PACT_BREAKING_CHANGE!=='true'
 *   port: '3001',
 *   stateHandlers
 *   logLevel: 'debug',
 * })
 */
export function buildVerifierOptions({
  provider,
  port,
  logLevel = 'info', // 'debug' is also useful
  stateHandlers,
  beforeEach,
  afterEach,
  includeMainAndDeployed,
  consumer,
  enablePending,
  requestFilter = noOpRequestFilter,
  publishVerificationResult = true,
  pactBrokerToken = process.env.PACT_BROKER_TOKEN,
  providerVersion = process.env.GITHUB_SHA,
  providerVersionBranch = process.env.GITHUB_BRANCH,
  pactBrokerUrl = process.env.PACT_BROKER_BASE_URL,
  pactPayloadUrl = process.env.PACT_PAYLOAD_URL
}: {
  provider: string
  port: string
  logLevel?: ProxyOptions['logLevel']
  stateHandlers?: StateHandlers & MessageStateHandlers
  beforeEach?: ProxyOptions['beforeEach']
  afterEach?: ProxyOptions['afterEach']
  includeMainAndDeployed: boolean
  consumer?: string
  enablePending?: boolean
  requestFilter?: ProxyOptions['requestFilter']
  publishVerificationResult?: boolean
  pactBrokerToken?: string
  providerVersion?: string
  providerVersionBranch?: string
  pactBrokerUrl?: string
  pactPayloadUrl?: string
}): VerifierOptions {
  console.table({
    Provider: provider,
    Port: port,
    'Log Level': logLevel,
    'State Handlers': stateHandlers ? 'Provided' : 'Not Provided',
    'Include Main and Deployed': includeMainAndDeployed,
    Consumer: consumer || 'All Consumers',
    PACT_BREAKING_CHANGE: process.env.PACT_BREAKING_CHANGE,
    PACT_BROKER_TOKEN: pactBrokerToken ? 'Provided' : 'Not Provided',
    'Provider Version': providerVersion,
    'Provider Version Branch': providerVersionBranch,
    'Pact Broker URL': pactBrokerUrl,
    'Pact Payload URL': pactPayloadUrl || 'Not Provided',
    'Enable Pending': enablePending,
    'Request Filter':
      requestFilter === noOpRequestFilter
        ? 'Default (No-Op)'
        : 'Custom Provided'
  })

  const options: VerifierOptions = {
    provider,
    logLevel,
    stateHandlers,
    beforeEach,
    afterEach,
    requestFilter,
    providerBaseUrl: `http://localhost:${port}`,
    publishVerificationResult,
    pactBrokerToken,
    providerVersion,
    providerVersionBranch,
    enablePending // use this if breaking changes from a consumer somehow got in main, and the provider cannot release (allow blasphemy!)
  }

  // When the CI triggers the provider tests, we need to use the PACT_PAYLOAD_URL
  // To use the PACT_PAYLOAD_URL, we need to update the provider options to use this URL instead.
  handlePactBrokerUrlAndSelectors({
    pactPayloadUrl,
    pactBrokerUrl,
    consumer,
    includeMainAndDeployed,
    options
  })

  return options
}

/**
 * Builds an array of `ConsumerVersionSelector` objects for Pact verification.
 *
 * Generates selectors to determine which consumer pacts should be verified against the provider.
 * Controls inclusion of pacts from the consumer's `main` branch and deployed or released versions,
 * which is useful when introducing breaking changes on the provider side.
 *
 * **Default Behavior:**
 * - **Consumers**: If `consumer` is `undefined`, selectors apply to all consumers.
 * - **Selectors**: `includeMainAndDeployed` defaults to `true`, including `mainBranch` and `deployedOrReleased` selectors.
 *
 * **Selectors Included:**
 * - `matchingBranch`: Always included. Selects pacts from consumer branches matching the provider's branch.
 * - `mainBranch`: Included when `includeMainAndDeployed` is `true`. Selects pacts from the consumer's main branch.
 * - `deployedOrReleased`: Included when `includeMainAndDeployed` is `true`. Selects pacts from the consumer's deployed or released versions.
 *
 * **Usage Scenarios:**
 * - **Regular Verification**: Use default parameters to verify against all relevant consumer versions across all consumers.
 * - **Specifying a Consumer**: Provide a `consumer` name to verify pacts for a specific consumer only.
 * - **Introducing Breaking Changes**: Set `includeMainAndDeployed` to `false` to exclude `mainBranch` and `deployedOrReleased` selectors, verifying only against matching branches to avoid failures due to incompatible pacts.
 *
 * @param consumer - The name of the consumer to verify against. If `undefined`, applies to all consumers.
 * @param includeMainAndDeployed - When `true` (default), includes `mainBranch` and `deployedOrReleased` selectors.
 * @returns An array of `ConsumerVersionSelector` objects for Pact verification.
 *
 * @example
 * // Run verification for a specific consumer, including all selectors (default behavior)
 * const selectors = buildConsumerVersionSelectors('MoviesAPI')
 * // Result:
 * // [
 * //   { consumer: 'MoviesAPI', matchingBranch: true },
 * //   { consumer: 'MoviesAPI', mainBranch: true },
 * //   { consumer: 'MoviesAPI', deployedOrReleased: true }
 * // ]
 *
 * @example
 * // Run verification for a specific consumer, excluding mainBranch and deployedOrReleased (e.g., when introducing breaking changes)
 * const selectors = buildConsumerVersionSelectors('MoviesAPI', false)
 * // Result:
 * // [
 * //   { consumer: 'MoviesAPI', matchingBranch: true }
 * // ]
 *
 * @example
 * // Run verification for all consumers, including all selectors
 * const selectors = buildConsumerVersionSelectors(undefined)
 * // Result:
 * // [
 * //   { matchingBranch: true },
 * //   { mainBranch: true },
 * //   { deployedOrReleased: true }
 * // ]
 *
 * @example
 * // Run verification for all consumers, excluding mainBranch and deployedOrReleased
 * const selectors = buildConsumerVersionSelectors(undefined, false)
 * // Result:
 * // [
 * //   { matchingBranch: true }
 * // ]
 *
 * @see https://docs.pact.io/pact_broker/advanced_topics/consumer_version_selectors
 */
function buildConsumerVersionSelectors(
  consumer: string | undefined,
  includeMainAndDeployed = true
): ConsumerVersionSelector[] {
  // Base selector includes the consumer if provided
  const baseSelector: Partial<ConsumerVersionSelector> = consumer
    ? { consumer }
    : {}

  const mainAndDeployed = [
    { ...baseSelector, mainBranch: true }, // Tests against consumer's main branch
    { ...baseSelector, deployedOrReleased: true } // Tests against consumer's currently deployed or released versions
  ]

  // Always include the matchingBranch selector
  // Conditionally include mainBranch and deployedOrReleased selectors
  return [
    { ...baseSelector, matchingBranch: true }, // Used for coordinated development between consumer and provider teams using matching feature branch names
    ...(includeMainAndDeployed ? mainAndDeployed : [])
  ]
}

/**
 * Builds a `PactMessageProviderOptions` object for message-based Pact verification,
 * encapsulating common provider test setup options for message handlers, Pact Broker options,
 * and dynamically generated consumer version selectors for message interactions.
 *
 * @param provider - The name of the provider being verified.
 * @param messageProviders - Handlers that map to specific message interactions defined by the consumer Pact.
 * @param includeMainAndDeployed - Flag to include `mainBranch` and `deployedOrReleased` selectors for verifying consumer interactions.
 * @param consumer - (Optional) A specific consumer to run verification for. If not provided, all consumers will be verified.
 * @param enablePending - (Optional, defaults to `false`) Whether to enable pending pacts.
 * @param logLevel - (Optional) Log level for debugging (e.g., 'info', 'debug').
 * @param publishVerificationResult - (Optional, defaults to `true`) Whether to publish verification results.
 * @param pactBrokerToken - (Optional) Token for authentication with the Pact Broker.
 * @param providerVersion - (Optional) The version of the provider, typically tied to a Git commit or build.
 * @param providerVersionBranch - (Optional) The branch of the provider being verified.
 * @param pactBrokerUrl - (Optional) URL of the Pact Broker.
 * @param pactPayloadUrl - (Optional) URL for fetching the pact payload (used in CI environments).
 *
 * @returns A fully configured `PactMessageProviderOptions` object for message-based Pact verification.
 *
 * @example
 * const options = buildMessageProviderPact({
 *   provider: 'MoviesAPI',
 *   messageProviders,
 *   includeMainAndDeployed: true,
 *   pactBrokerUrl: process.env.PACT_BROKER_BASE_URL
 * })
 */
export function buildMessageProviderPact({
  provider,
  messageProviders,
  includeMainAndDeployed,
  consumer,
  enablePending = false,
  logLevel = 'info',
  publishVerificationResult = true,
  pactBrokerToken = process.env.PACT_BROKER_TOKEN,
  providerVersion = process.env.GITHUB_SHA,
  providerVersionBranch = process.env.GITHUB_BRANCH,
  pactBrokerUrl = process.env.PACT_BROKER_BASE_URL,
  pactPayloadUrl = process.env.PACT_PAYLOAD_URL
}: {
  provider: string
  messageProviders: MessageProviders
  includeMainAndDeployed: boolean
  consumer?: string
  enablePending?: boolean
  logLevel?: ProxyOptions['logLevel']
  publishVerificationResult?: boolean
  pactBrokerToken?: string
  providerVersion?: string
  providerVersionBranch?: string
  pactBrokerUrl?: string
  pactPayloadUrl?: string
}): PactMessageProviderOptions {
  console.table({
    Provider: provider,
    'Message Handlers': messageProviders ? 'Provided' : 'Not Provided',
    'Include Main and Deployed': includeMainAndDeployed,
    Consumer: consumer || 'All Consumers',
    PACT_BROKER_TOKEN: pactBrokerToken ? 'Provided' : 'Not Provided',
    'Provider Version': providerVersion,
    'Provider Version Branch': providerVersionBranch,
    'Pact Broker URL': pactBrokerUrl || 'Not Provided',
    'Pact Payload URL': pactPayloadUrl || 'Not Provided',
    'Enable Pending': enablePending,
    'Log Level': logLevel
  })

  const options: PactMessageProviderOptions = {
    provider,
    messageProviders,
    logLevel,
    publishVerificationResult,
    pactBrokerToken,
    providerVersion,
    providerVersionBranch,
    enablePending // use this if breaking changes from a consumer somehow got in main, and the provider cannot release (allow blasphemy!)
  }

  handlePactBrokerUrlAndSelectors({
    pactPayloadUrl,
    pactBrokerUrl,
    consumer,
    includeMainAndDeployed,
    options
  })

  return options
}

/**
 * Handles the conditional logic for selecting the Pact Broker URL and consumer version selectors.
 * It updates the verifier options accordingly based on the availability of the Pact payload URL or
 * Pact Broker base URL and includes relevant consumer version selectors if needed.
 *
 * @param pactPayloadUrl - The URL for Pact payloads, used when CI triggers provider tests.
 * @param pactBrokerUrl - The base URL for the Pact Broker.
 * @param consumer - (Optional) A specific consumer to verify. If not provided, all consumers are verified.
 * @param includeMainAndDeployed - Flag indicating whether to include `mainBranch` and `deployedOrReleased` selectors.
 * @param options - The options object to update with Pact URL or Pact Broker information.
 */
function handlePactBrokerUrlAndSelectors({
  pactPayloadUrl,
  pactBrokerUrl,
  consumer,
  includeMainAndDeployed,
  options
}: {
  pactPayloadUrl?: string
  pactBrokerUrl?: string
  consumer?: string
  includeMainAndDeployed: boolean
  options: PactMessageProviderOptions | VerifierOptions
}): void {
  // When the CI triggers the provider tests, we need to use the PACT_PAYLOAD_URL
  if (pactPayloadUrl) {
    console.log(`Pact payload URL specified: ${process.env.PACT_PAYLOAD_URL}`)
    options.pactUrls = [pactPayloadUrl as string]
  } else {
    console.log(`Using Pact Broker Base URL: ${pactBrokerUrl}`)
    options.pactBrokerUrl = pactBrokerUrl

    options.consumerVersionSelectors = buildConsumerVersionSelectors(
      consumer,
      includeMainAndDeployed
    )

    if (consumer) {
      console.log(`Running verification for consumer: ${consumer}`)
    } else {
      console.log('Running verification for all consumers')
    }

    if (includeMainAndDeployed) {
      console.log(
        'Including main branch and deployedOrReleased in the verification'
      )
    } else {
      console.log(
        'Only running the matching branch, this is useful when introducing breaking changes'
      )
    }
  }
}
