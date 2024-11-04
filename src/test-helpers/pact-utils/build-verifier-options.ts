import type {
  MessageProviders,
  MessageStateHandlers,
  PactMessageProviderOptions,
  VerifierOptions
} from '@pact-foundation/pact'
import type {
  ProxyOptions,
  StateHandlers
} from '@pact-foundation/pact/src/dsl/verifier/proxy/types'
import { noOpRequestFilter } from './pact-request-filter'
import { handlePactBrokerUrlAndSelectors } from './handle-url-and-selectors'

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
  providerVersionBranch = process.env.GITHUB_BRANCH || 'main', // default to main if provider branch is not set
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
export function buildMessageVerifierOptions({
  provider,
  messageProviders,
  includeMainAndDeployed,
  stateHandlers,
  consumer,
  enablePending = false,
  logLevel = 'info',
  publishVerificationResult = true,
  pactBrokerToken = process.env.PACT_BROKER_TOKEN,
  providerVersion = process.env.GITHUB_SHA,
  providerVersionBranch = process.env.GITHUB_BRANCH || 'main', // default to main if provider branch is not set
  pactBrokerUrl = process.env.PACT_BROKER_BASE_URL,
  pactPayloadUrl = process.env.PACT_PAYLOAD_URL
}: {
  provider: string
  messageProviders: MessageProviders
  includeMainAndDeployed: boolean
  stateHandlers?: StateHandlers & MessageStateHandlers
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
    'State Handlers': stateHandlers ? 'Provided' : 'Not Provided',
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
    stateHandlers,
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
