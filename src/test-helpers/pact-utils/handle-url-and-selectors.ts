import type {
  PactMessageProviderOptions,
  VerifierOptions
} from '@pact-foundation/pact'
import type { ConsumerVersionSelector } from '@pact-foundation/pact-core'

/**
 * Handles the conditional logic for selecting the Pact Broker URL and consumer version selectors.
 * It updates the verifier options accordingly based on the availability of the Pact payload URL or
 * Pact Broker base URL, and includes relevant consumer version selectors if needed.
 *
 * @param pactPayloadUrl - The URL for Pact payloads, used when CI triggers provider tests.
 * @param pactBrokerUrl - The base URL for the Pact Broker.
 * @param consumer - (Optional) A specific consumer to verify. If not provided, all consumers are verified.
 * @param includeMainAndDeployed - Flag indicating whether to include `mainBranch` and `deployedOrReleased` selectors.
 * @param options - The options object to update with Pact URL or Pact Broker information.
 */
export function handlePactBrokerUrlAndSelectors({
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
}) {
  // If pactPayloadUrl is provided, attempt to use it
  if (pactPayloadUrl) {
    const usedPayloadUrl = processPactPayloadUrl(
      pactPayloadUrl,
      consumer,
      options
    )
    if (usedPayloadUrl) {
      return // Successfully used the Pact payload URL, no need to proceed further
    }
    // If not used, continue to set up options using the Pact Broker URL and selectors
  }

  // Use the Pact Broker URL and consumer version selectors
  usePactBrokerUrlAndSelectors(
    pactBrokerUrl,
    consumer,
    includeMainAndDeployed,
    options
  )
}

/**
 * Processes the Pact payload URL to determine if it should be used for verification.
 *
 * @param pactPayloadUrl - The URL of the Pact payload.
 * @param consumer - (Optional) The name of the consumer.
 * @param options - The verifier options to update.
 * @returns `true` if the Pact payload URL was used; otherwise, `false`.
 */
function processPactPayloadUrl(
  pactPayloadUrl: string,
  consumer: string | undefined,
  options: PactMessageProviderOptions | VerifierOptions
): boolean {
  console.log(`Pact payload URL provided: ${pactPayloadUrl}`)

  const parsed = parseProviderAndConsumerFromUrl(pactPayloadUrl)

  // If we got the provider and consumer names from the URL
  if (parsed) {
    const { provider: pactUrlProvider, consumer: pactUrlConsumer } = parsed
    console.log(`Pact URL Provider: ${pactUrlProvider}`)
    console.log(`Pact URL Consumer: ${pactUrlConsumer}`)

    // Compare the provider and consumer names with the intended/provided provider and consumer
    const providerMatches = options.provider === pactUrlProvider
    // If no consumer is provided, ignore the consumer name, allowing all consumers to match.
    // Otherwise, verify only the specified consumer.
    const consumerMatches = !consumer || consumer === pactUrlConsumer

    if (providerMatches && consumerMatches) {
      usePactPayloadUrl(pactPayloadUrl, options)
      return true // Indicate that the Pact payload URL was used
    } else {
      console.log(
        `PACT_PAYLOAD_URL does not match the provider (${options.provider}) and consumer (${consumer || 'all'}), ignoring it`
      )
    }
  } else {
    console.log(
      'Could not parse provider and consumer from PACT_PAYLOAD_URL, ignoring it'
    )
  }

  return false // Indicate that the Pact payload URL was not used
}

/**
 * Parses the provider and consumer names from the given Pact payload URL. *
 * @param pactPayloadUrl - The URL of the Pact payload.
 * @returns An object containing the provider and consumer names if parsing is successful; otherwise, null.
 * */
function parseProviderAndConsumerFromUrl(
  pactPayloadUrl: string
): { provider: string; consumer: string } | null {
  // match url pattern: /pacts/provider/{provider_name}/consumer/{consumer_name}/
  // with 2 capture groups: provider_name and consumer_name
  const regex = /\/pacts\/provider\/([^/]+)\/consumer\/([^/]+)\//
  const match = regex.exec(pactPayloadUrl)

  if (match) {
    const provider = decodeURIComponent(match[1] as string)
    const consumer = decodeURIComponent(match[2] as string)
    return { provider, consumer }
  }

  return null
}

/**
 * Configures the verifier options to use the Pact payload URL for verification.
 *
 * @param pactPayloadUrl - The URL of the Pact payload.
 * @param options - The verifier options to update.
 */
function usePactPayloadUrl(
  pactPayloadUrl: string,
  options: PactMessageProviderOptions | VerifierOptions
) {
  console.log(
    'PACT_PAYLOAD_URL matches the provider and consumer, using it for verification'
  )
  options.pactUrls = [pactPayloadUrl]

  // remove pactBrokerUrl and consumerVersionSelectors if set
  delete options.pactBrokerUrl
  delete options.consumerVersionSelectors
}

/**
 * Configures the verifier options to use the Pact Broker URL and consumer version selectors.
 *
 * @param pactBrokerUrl - The base URL of the Pact Broker.
 * @param consumer - (Optional) The name of the consumer.
 * @param includeMainAndDeployed - Whether to include main and deployed/released selectors.
 * @param options - The verifier options to update.
 */
function usePactBrokerUrlAndSelectors(
  pactBrokerUrl: string | undefined,
  consumer: string | undefined,
  includeMainAndDeployed: boolean,
  options: PactMessageProviderOptions | VerifierOptions
) {
  if (!pactBrokerUrl) {
    throw new Error('PACT_BROKER_BASE_URL is required but not set.')
  }

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

  // tell the provider to verify pacts from all branches of the consumer, including feature branches.
  const featureBranchSelector = { ...baseSelector, branch: '*' }

  // Conditionally include mainBranch and deployedOrReleased selectors
  return [
    featureBranchSelector,
    ...(includeMainAndDeployed ? mainAndDeployed : [])
  ]
}
