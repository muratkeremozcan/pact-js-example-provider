import type { ConsumerVersionSelector } from '@pact-foundation/pact-core'

/**
 * Builds an array of `ConsumerVersionSelector` objects for Pact verification.
 *
 * Generates selectors to determine which consumer pacts should be verified against the provider.
 * Controls inclusion of pacts from the consumer's `main` branch and deployed or released versions,
 * which is useful when introducing breaking changes on the provider side.
 *
 * **Default Behavior:**
 *
 * - **Consumers**: If `consumer` is `undefined`, selectors apply to all consumers.
 * - **Selectors**: `includeMainAndDeployed` defaults to `true`, including `mainBranch` and `deployedOrReleased` selectors.
 *
 * **Selectors Included:**
 *
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
 * const selectors = buildConsumerVersionSelectors('MoviesAPI');
 * // Result:
 * // [
 * //   { consumer: 'MoviesAPI', matchingBranch: true },
 * //   { consumer: 'MoviesAPI', mainBranch: true },
 * //   { consumer: 'MoviesAPI', deployedOrReleased: true }
 * // ]
 *
 * @example
 * // Run verification for a specific consumer, excluding mainBranch and deployedOrReleased (e.g., when introducing breaking changes)
 * const selectors = buildConsumerVersionSelectors('MoviesAPI', false);
 * // Result:
 * // [
 * //   { consumer: 'MoviesAPI', matchingBranch: true }
 * // ]
 *
 * @example
 * // Run verification for all consumers, including all selectors
 * const selectors = buildConsumerVersionSelectors(undefined);
 * // Result:
 * // [
 * //   { matchingBranch: true },
 * //   { mainBranch: true },
 * //   { deployedOrReleased: true }
 * // ]
 *
 * @example
 * // Run verification for all consumers, excluding mainBranch and deployedOrReleased
 * const selectors = buildConsumerVersionSelectors(undefined, false);
 * // Result:
 * // [
 * //   { matchingBranch: true }
 * // ]
 *
 * @see https://docs.pact.io/pact_broker/advanced_topics/consumer_version_selectors
 */
export function buildConsumerVersionSelectors(
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
