import type {
  PactMessageProviderOptions,
  VerifierOptions
} from '@pact-foundation/pact'
import type { ConsumerVersionSelector } from '@pact-foundation/pact-core'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const isCI = require('is-ci')

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
  usePactBrokerUrlAndSelectors({
    pactBrokerUrl,
    consumer,
    includeMainAndDeployed,
    options
  })
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
function usePactBrokerUrlAndSelectors({
  pactBrokerUrl,
  consumer,
  includeMainAndDeployed,
  options
}: {
  pactBrokerUrl: string | undefined
  consumer: string | undefined
  includeMainAndDeployed: boolean
  options: PactMessageProviderOptions | VerifierOptions
}) {
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

  // Log the consumer version selectors for debugging
  console.log(
    'Consumer Version Selectors:',
    JSON.stringify(options.consumerVersionSelectors, null, 2)
  )
}

/**
 * Generates an array of tags to associate with the provider version.
 * Tags can include the current branch name, environment, or other identifiers.
 * Tags are only used in Webhooks, therefore we use is-ci
 *
 * @returns An array of strings representing the provider version tags.
 *
 * @example
 * // In a CI environment with GITHUB_BRANCH set to 'refs/heads/feature-branch'
 * const tags = getProviderVersionTags()
 * // tags => ['feature-branch']
 */
export function getProviderVersionTags(): string[] {
  const tags = []

  if (isCI) {
    // only include dev if it's not a breaking change
    // Convert PACT_BREAKING_CHANGE to boolean
    const isBreakingChange = process.env.PACT_BREAKING_CHANGE === 'true'
    console.log({ isBreakingChange })
    // Only include 'dev' if it's not a breaking change
    if (!isBreakingChange) {
      tags.push('dev')
    }

    // Include the branch name as a tag
    if (process.env.GITHUB_BRANCH) {
      const branchName = process.env.GITHUB_BRANCH
      tags.push(branchName)
    }
  } else {
    tags.push('local')
  }

  console.log('providerVersionTags:', tags)
  return tags
}

/**
 * Builds an array of `ConsumerVersionSelector` objects for Pact verification.
 *
 * This function generates selectors that determine which consumer pacts should be verified against the provider.
 * By default, it includes pacts from branches matching the provider's branch, and optionally includes pacts from
 * the consumer's `main` branch and deployed or released versions.
 *
 * **Note:** The `branch: '*'` selector has been removed to prevent the provider from verifying pacts from all
 * consumer branches, which can include irrelevant or unverified branches.
 *
 * @param consumer - The name of the consumer to verify against. If `undefined`, applies to all consumers.
 * @param includeMainAndDeployed - When `true` (default), includes `mainBranch` and `deployedOrReleased` selectors for broader verification.
 *                                 When `false`, only verifies pacts from matching branches.
 * @returns An array of `ConsumerVersionSelector` objects for Pact verification.
 *
 * @example
 * // Verify pacts for a specific consumer, including main and deployed versions (default behavior)
 * const selectors = buildConsumerVersionSelectors('WebConsumer');
 * // Result:
 * // [
 * //   { consumer: 'WebConsumer', matchingBranch: true },
 * //   { consumer: 'WebConsumer', mainBranch: true },
 * //   { consumer: 'WebConsumer', deployedOrReleased: true }
 * // ]
 *
 * @example
 * // Verify pacts for a specific consumer, excluding mainBranch and deployedOrReleased
 * const selectors = buildConsumerVersionSelectors('WebConsumer', false);
 * // Result:
 * // [
 * //   { consumer: 'WebConsumer', matchingBranch: true }
 * // ]
 *
 * @example
 * // Verify pacts for all consumers, including main and deployed versions
 * const selectors = buildConsumerVersionSelectors(undefined);
 * // Result:
 * // [
 * //   { matchingBranch: true },
 * //   { mainBranch: true },
 * //   { deployedOrReleased: true }
 * // ]
 *
 * @example
 * // Verify pacts for all consumers, excluding mainBranch and deployedOrReleased
 * const selectors = buildConsumerVersionSelectors(undefined, false);
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
  // Create the base selector object.
  // If a specific consumer is provided, include it in the selector.
  const baseSelector: Partial<ConsumerVersionSelector> = consumer
    ? { consumer }
    : {}

  // Start with selectors that always apply.
  // - 'matchingBranch: true' includes branches that match the provider's branch.
  const selectors: ConsumerVersionSelector[] = [
    { ...baseSelector, matchingBranch: true } // Includes matching branches
  ]

  // If 'includeMainAndDeployed' is true, include selectors for:
  // - The main branch of the consumer (mainBranch: true)
  // - Deployed or released versions of the consumer (deployedOrReleased: true)
  if (includeMainAndDeployed) {
    selectors.push({ ...baseSelector, mainBranch: true }) // Includes the main branch of the consumer
    selectors.push({ ...baseSelector, deployedOrReleased: true }) // Includes deployed or released consumer versions
  }

  // The 'branch: "*"' selector has been intentionally removed to prevent
  // verification of pacts from all branches, which may include irrelevant or
  // unverified branches.

  return selectors
}
