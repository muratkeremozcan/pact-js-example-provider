// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import type { VerifierOptions } from '@pact-foundation/pact'
import { Verifier } from '@pact-foundation/pact'
import { movies, server, importData } from './provider'
// 1) Run the provider service
// 2) Setup the provider verifier options
// 3) Write & execute the provider contract test

// TODO: Address the current limitation with data initialization.
// The current setup requires starting the server and importing the data within the test itself,
// ensuring that the stateHandlers can access the necessary state.
// This approach is not ideal because it tightly couples data setup with test execution,
// leading to potential issues with test isolation and parallelism.

// Future improvements:
// - Separate the data layer, possibly using SQLite, to manage state independently
// - Add a service client to interact with the service / database (refashion movies.js?)
// - Enhance the workflow by starting and stopping the server via package.json scripts, decoupling it from the test file.

const port = '3001'
const app = server.listen(port, () =>
  console.log(`Listening on port ${port}...`)
)

importData()

// TODO: find out the best way to convert it to TS,
// the consumer will have to change state it is passing, I think
// it may have to be like the below:
// based on node_modules/@pact-foundation/pact/src/dsl/message.d.ts
// export interface ProviderState {
//   name: string;
//   params?: {
//       [name: string]: string;
//   };
// }
const stateHandlers = {
  'Has a movie with a specific ID': (params) => {
    const movieId = Number(params.id) // Convert the ID back to a number
    movies.getFirstMovie().id = movieId
    return Promise.resolve({
      description: `Movie with ID ${movieId} added!`
    })
  },
  'An existing movie exists': (params) => {
    const movie = {
      ...params,
      year: Number(params.year) // Convert the year back to a number
    }
    movies.addMovie(movie)
    return Promise.resolve({
      description: `Movie with name ${params.name} added!`
    })
  }
}

// Improve this with the pact setup at https://github.com/pactflow/example-provider/blob/master/src/product/product.consumerChange.pact.test.js
// 2) Setup the provider verifier options
const options: VerifierOptions = {
  provider: 'MoviesAPI',
  providerBaseUrl: `http://localhost:${port}`,
  publishVerificationResult: true,
  pactBrokerToken: process.env.PACT_BROKER_TOKEN as string,
  providerVersion: process.env.GITHUB_SHA as string,
  providerVersionBranch: process.env.GITHUB_BRANCH as string, // represents which contracts the provider should verify against

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
  stateHandlers
}

// When the CI triggers the provider tests, we need to use the PACT_PAYLOAD_URL
// To use the PACT_PAYLOAD_URL, we need to update the provider options to use this URL instead.

if (process.env.PACT_PAYLOAD_URL) {
  console.log(`Pact payload URL specified: ${process.env.PACT_PAYLOAD_URL}`)
  options.pactUrls = [process.env.PACT_PAYLOAD_URL]
} else {
  console.log(`Using Pact Broker Base URL: ${process.env.PACT_BROKER_BASE_URL}`)

  options.pactBrokerUrl = process.env.PACT_BROKER_BASE_URL as string

  // https://docs.pact.io/pact_broker/advanced_topics/consumer_version_selectors#properties
  options.consumerVersionSelectors = [
    // { mainBranch: true }, // tests against consumer's main branch
    { matchingBranch: true } // used for coordinated development between consumer and provider teams using matching feature branch names
    // { deployedOrReleased: true } // tests against consumer's currently deployed version
  ]
}

const verifier = new Verifier(options)

describe('Pact Verification', () => {
  afterAll(() => {
    app.close()
  })

  it('should validate the expectations of movie-consumer', () => {
    // 3) Write & execute the provider contract test (you have to return)
    return verifier.verifyProvider().then((output) => {
      console.log('Pact Verification Complete!')
      console.log('Result:', output)
    })
  })
})
