import type { ConsumerVersionSelector } from '@pact-foundation/pact-core'
import type {
  MessageStateHandlers,
  VerifierOptions
} from '@pact-foundation/pact'
import type {
  ProxyOptions,
  StateHandlers
} from '@pact-foundation/pact/src/dsl/verifier/proxy/types'
import { noOpRequestFilter } from './pact-request-filter'

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
    'Enable Pending': enablePending
  })

  console.log('Request filter being passed to Verifier:', requestFilter)

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

  console.log('Verifier options:', options)

  // When the CI triggers the provider tests, we need to use the PACT_PAYLOAD_URL
  // To use the PACT_PAYLOAD_URL, we need to update the provider options to use this URL instead.
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
