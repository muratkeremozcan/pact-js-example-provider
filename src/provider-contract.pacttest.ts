import { Verifier } from '@pact-foundation/pact'
import { stateHandlers } from './test-helpers/state-handlers'
import { buildVerifierOptions } from './test-helpers/pact-utils/build-verifier-options'
import { truncateTables } from '../scripts/truncate-tables'
import { requestFilter } from './test-helpers/pact-utils/pact-request-filter'

// 1) Run the provider service
// 2) Setup the provider verifier options
// 3) Write & execute the provider contract test

const PACT_BREAKING_CHANGE = process.env.PACT_BREAKING_CHANGE || 'false'
const PACT_ENABLE_PENDING = process.env.PACT_ENABLE_PENDING || 'false'
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'local'

describe('Pact Verification', () => {
  // 2) Setup the provider verifier options
  const port = process.env.PORT || '3001'
  const options = buildVerifierOptions({
    provider: 'MoviesAPI',
    consumer: 'WebConsumer', // with multiple pact test files, best to specify the consumer
    includeMainAndDeployed: PACT_BREAKING_CHANGE !== 'true', // if it is a breaking change, set the env var
    enablePending: PACT_ENABLE_PENDING === 'true',
    // logLevel: 'debug',
    port,
    stateHandlers,
    requestFilter,
    beforeEach: async () => {
      // console.log('I run before each test coming from the consumer...')
      await truncateTables()
      return Promise.resolve()
    }
    // afterEach: () => {
    //   console.log('I run after each test coming from the consumer...')
    //   return Promise.resolve()
    // }
  })
  const verifier = new Verifier(options)

  // our produceMovieEvent has some console.logs which we don't need during tests
  // but you can comment these out if you want to see them.
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterAll(() => {
    jest.restoreAllMocks()
  })

  it('should validate the expectations of movie-consumer', async () => {
    // 3) Write & execute the provider contract test
    try {
      const output = await verifier.verifyProvider()
      console.log('Pact Verification Complete!')
      console.log('Result:', output)
    } catch (error) {
      console.error('Pact Verification Failed:', error)

      if (PACT_BREAKING_CHANGE === 'true' && GITHUB_BRANCH === 'main') {
        console.log(
          'Ignoring Pact verification failures due to breaking change on main branch.'
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

# to relax the can:i:deploy and only check against matching branches
PACT_BREAKING_CHANGE=true npm run test:provider
*/
