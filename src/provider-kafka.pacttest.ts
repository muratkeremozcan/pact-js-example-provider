import {
  MessageProviderPact,
  providerWithMetadata,
  Verifier
} from '@pact-foundation/pact'
import { stateHandlers } from './test-helpers/state-handlers'
import { buildVerifierOptions } from './test-helpers/pact-utils'
import { truncateTables } from '../scripts/truncate-tables'
import { requestFilter } from './test-helpers/pact-request-filter'
import { produceMovieEvent } from './events/movie-events'
import { generateMovie } from './test-helpers/factories'
import type { Movie } from '@prisma/client'

// 1) Run the provider service
// 2) Setup the provider verifier options
// 3) Write & execute the provider contract test

const PACT_BREAKING_CHANGE = process.env.PACT_BREAKING_CHANGE || 'false'
const PACT_ENABLE_PENDING = process.env.PACT_ENABLE_PENDING || 'false'
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'local'

describe('Pact Verification', () => {
  const movie: Movie = { id: 7, ...generateMovie() }

  const provider = new MessageProviderPact({
    messageProviders: {
      'a movie-created event': providerWithMetadata(
        () => produceMovieEvent(movie, 'created'),
        {
          contentType: 'application/json'
        }
      ),
      'a movie-updated event': providerWithMetadata(
        () => produceMovieEvent(movie, 'updated'),
        {
          contentType: 'application/json'
        }
      ),
      'a movie-deleted event': providerWithMetadata(
        () => produceMovieEvent(movie, 'deleted'),
        {
          contentType: 'application/json'
        }
      )
    },
    // logLevel: 'debug',
    provider: 'MoviesAPI-event-producer', // Ensure unique provider name for message pacts
    providerVersion: process.env.GITHUB_SHA,
    providerVersionBranch: process.env.GITHUB_BRANCH,
    pactBrokerUrl: process.env.PACT_BROKER_BASE_URL,
    pactBrokerToken: process.env.PACT_BROKER_TOKEN,
    publishVerificationResult: true,
    consumerVersionSelectors: [
      { mainBranch: true },
      { matchingBranch: true },
      { deployedOrReleased: true }
    ]
  })

  it('should validate the expectations of movie-consumer', async () => {
    // 3) Write & execute the provider contract test
    try {
      const output = await provider.verify()
      console.log('Pact Message Verification Complete!')
      console.log('Result:', output)
    } catch (error) {
      console.error('Pact Message Verification Failed:', error)

      if (PACT_BREAKING_CHANGE === 'true' && GITHUB_BRANCH === 'main') {
        console.log(
          'Ignoring Pact Message verification failures due to breaking change on main branch.'
        )
      } else {
        throw error // Re-throw the error to fail the test
      }
    }
  })
})

// Selective testing note: If you prefix your test command (e.g. npm t) with the following environment variables,
//  you can selectively run a specific interaction during provider verification.
// You can also filter tests to a certain consumer.
// https://docs.pact.io/implementation_guides/javascript/docs/troubleshooting
// PACT_DESCRIPTION:   	   select all tests that contain this string in its description(from the test output, or the pact file)
// PACT_PROVIDER_STATE:	   select all tests that contain this string in one of its providerState
// PACT_PROVIDER_NO_STATE: set to TRUE to select all tests what don't have any providerState
/*

examples:

PACT_DESCRIPTION="a request to get all movies" npm run test:provider
PACT_DESCRIPTION="a request to get all movies" PACT_PROVIDER_STATE="An existing movie exists" npm run test:provider

PACT_PROVIDER_STATE="Has a movie with a specific ID" npm run test:provider
PACT_DESCRIPTION="a request to a specific movie" PACT_PROVIDER_STATE="Has a movie with a specific ID" npm run test:provider

PACT_DESCRIPTION="a request to delete a movie that exists" PACT_PROVIDER_STATE="Has a movie with a specific ID" npm run test:provider

PACT_PROVIDER_NO_STATE=true npm run test:provider

# to run tests from a certain consumer
PACT_CONSUMER="WebConsumer" npm run test:provider

# to relax the can:i:deploy and only check against matching branches
PACT_BREAKING_CHANGE=true npm run test:provider
*/
