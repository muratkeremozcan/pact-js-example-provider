import type { VerifierOptions } from '@pact-foundation/pact'
import { Verifier } from '@pact-foundation/pact'
import { stateHandlers } from './test-helpers/state-handlers'

// 1) Run the provider service
// 2) Setup the provider verifier options
// 3) Write & execute the provider contract test

const port = process.env.PORT

describe('Pact Verification', () => {
  let verifier: Verifier
  beforeAll(async () => {
    // Improve this with the pact setup at https://github.com/pactflow/example-provider/blob/master/src/product/product.consumerChange.pact.test.js
    // 2) Setup the provider verifier options
    const options: VerifierOptions = {
      provider: 'MoviesAPI',
      providerBaseUrl: `http://localhost:${port}`,
      publishVerificationResult: true,
      pactBrokerToken: process.env.PACT_BROKER_TOKEN as string,
      providerVersion: process.env.GITHUB_SHA as string,
      providerVersionBranch: process.env.GITHUB_BRANCH as string, // represents which contracts the provider should verify against
      // logLevel: 'debug',

      // PROVIDER STATES: we can simulate certain states of the API (like an empty or non-empty DB)
      // in order to cover different scenarios
      // The state could have many more variables; it is a good practice to represent it as an object
      // Note that the consumer state name should match the provider side
      //
      // * The purpose of the stateHandlers is to ensure that the provider is in the correct state
      // to fulfill the consumer's expectations as defined in the contract tests.
      // * In a real-world scenario, you would typically set up this state by interacting with your service's database
      // * or through an API provided by the service itself (locally).
      // * This ensures that the provider test runs in a controlled environment where all the necessary data
      // and conditions are met, allowing for accurate verification of the consumer's expectations.
      stateHandlers,
      beforeEach: () => {
        console.log('I run before each test coming from the consumer...')
        return Promise.resolve()
      },
      afterEach: () => {
        console.log('I run after each test coming from the consumer...')
        return Promise.resolve()
      }
    }

    // When the CI triggers the provider tests, we need to use the PACT_PAYLOAD_URL
    // To use the PACT_PAYLOAD_URL, we need to update the provider options to use this URL instead.

    if (process.env.PACT_PAYLOAD_URL) {
      console.log(`Pact payload URL specified: ${process.env.PACT_PAYLOAD_URL}`)
      options.pactUrls = [process.env.PACT_PAYLOAD_URL]
    } else {
      console.log(
        `Using Pact Broker Base URL: ${process.env.PACT_BROKER_BASE_URL}`
      )

      options.pactBrokerUrl = process.env.PACT_BROKER_BASE_URL as string

      // https://docs.pact.io/pact_broker/advanced_topics/consumer_version_selectors#properties
      options.consumerVersionSelectors = [
        { mainBranch: true }, // tests against consumer's main branch
        { matchingBranch: true }, // used for coordinated development between consumer and provider teams using matching feature branch names
        { deployedOrReleased: true } // tests against consumer's currently deployed version
      ]
    }
    verifier = new Verifier(options)
  })

  it('should validate the expectations of movie-consumer', async () => {
    // 3) Write & execute the provider contract test (you have to return)
    const output = await verifier.verifyProvider()
    console.log('Pact Verification Complete!')
    console.log('Result:', output)
  })
})

// Selective testing note: If you prefix your test command (e.g. npm t) with the following environment variables,
//  you can selectively run a specific interaction during provider verification.
// https://docs.pact.io/implementation_guides/javascript/docs/troubleshooting
// PACT_DESCRIPTION:   	   select all tests that contain this string in its description(from the test output, or the pact file)
// PACT_PROVIDER_STATE:	   select all tests that contain this string in on of its providerState
// PACT_PROVIDER_NO_STATE: set to TRUE to select all tests what don't have any providerState
/*

examples:

PACT_DESCRIPTION="a request to get all movies" npm run test:provider
PACT_DESCRIPTION="a request to get all movies" PACT_PROVIDER_STATE="An existing movie exists" npm run test:provider

PACT_PROVIDER_STATE="Has a movie with a specific ID" npm run test:provider
PACT_DESCRIPTION="a request to a specific movie" PACT_PROVIDER_STATE="Has a movie with a specific ID" npm run test:provider

PACT_DESCRIPTION="a request to delete a movie that exists" PACT_PROVIDER_STATE="Has a movie with a specific ID" npm run test:provider

PACT_PROVIDER_NO_STATE=true npm run test:provider

*/
