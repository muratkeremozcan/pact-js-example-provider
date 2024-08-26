const { Verifier } = require('@pact-foundation/pact')
const { movies, server, importData } = require('./provider')

// 1) Run the provider service
// 2) Setup the provider verifier options
// 3) Write & execute the provider contract test

// TODO: Address the current limitation with data initialization.
// The current setup requires starting the server and importing the data within the test itself,
// ensuring that the stateHandlers can access the necessary state.
// This approach is not ideal  because it tightly couples data setup with test execution,
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

// 2) Setup the provider verifier options
const options = {
  provider: 'MoviesAPI',
  providerBaseUrl: `http://localhost:${port}`,
  publishVerificationResult: true,
  pactBrokerUrl: process.env.PACT_BROKER_BASE_URL,
  pactBrokerToken: process.env.PACT_BROKER_TOKEN,
  providerVersion: process.env.GITHUB_SHA,
  providerVersionBranch: process.env.GITHUB_BRANCH, // represents which contracts the provider should verify against
  consumerVersionSelectors: [
    { mainBranch: true }, // tests against consumer's main branch
    { deployedOrReleased: true } // tests against consumer's currently deployed and currently released versions
    // { matchingBranch: true }, // Used for coordinated development between consumer and provider teams using matching feature branch names
    // more at https://docs.pact.io/pact_broker/advanced_topics/consumer_version_selectors#properties
  ],
  // PROVIDER STATES: we can simulate certain states of the api (like an empty or non-empty db)
  // in order to cover different scenarios
  // the state could have many more variables; it is a good practice to represent it as an object
  // note that the consumer state name should match the provider side
  //
  // * The purpose of the stateHandlers is to ensure that the provider is in the correct state
  // to fulfill the consumer's expectations as defined in the contract tests.
  // * In a real-world scenario, you would typically set up this state by interacting with your service's database
  // * or through an API provided by the service itself (locally).
  // * This ensures that the provider test runs in a controlled environment where all the necessary data
  // and conditions are met, allowing for accurate verification of the consumer's expectations.
  stateHandlers: {
    'Has a movie with a specific ID': (state) => {
      movies.getFirstMovie().id = state.id
      return Promise.resolve({
        description: `Movie with ID ${state.id} added!`
      })
    },
    'An existing movie exists': (state) => {
      movies.addMovie(state)
      return Promise.resolve({
        description: `Movie with ID ${state.id} added!`
      })
    }
  }
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
