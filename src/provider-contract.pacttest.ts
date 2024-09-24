import { Verifier } from '@pact-foundation/pact'
import { stateHandlers } from './test-helpers/state-handlers'
import { buildVerifierOptions } from './test-helpers/pact-utils'

// 1) Run the provider service
// 2) Setup the provider verifier options
// 3) Write & execute the provider contract test

describe('Pact Verification', () => {
  // 2) Setup the provider verifier options
  const port = process.env.PORT || '3001'
  const options = buildVerifierOptions({
    provider: 'MoviesAPI',
    consumer: process.env.PACT_CONSUMER, // filter by the consumer, or run for all if no env var is provided
    includeMainAndDeployed: process.env.PACT_BREAKING_CHANGE !== 'true', // if it is a breaking change, set the env var
    enablePending: process.env.PACT_BREAKING_CHANGE == 'true',
    port,
    stateHandlers,
    beforeEach: () => {
      console.log('I run before each test coming from the consumer...')
      return Promise.resolve()
    },
    afterEach: () => {
      console.log('I run after each test coming from the consumer...')
      return Promise.resolve()
    }
  })
  const verifier = new Verifier(options)

  it('should validate the expectations of movie-consumer', async () => {
    // 3) Write & execute the provider contract test
    const output = await verifier.verifyProvider()
    console.log('Pact Verification Complete!')
    console.log('Result:', output)
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
