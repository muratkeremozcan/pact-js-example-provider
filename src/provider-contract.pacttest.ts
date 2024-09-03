import type {
  MessageStateHandlers,
  VerifierOptions
} from '@pact-foundation/pact'
import { Verifier } from '@pact-foundation/pact'
import type { AnyJson } from '@pact-foundation/pact/src/common/jsonTypes'
import type { StateHandlers } from '@pact-foundation/pact/src/dsl/verifier/proxy/types'
import { PrismaClient, type Movie as MovieType } from '@prisma/client'
import { server } from './provider'
import Movie from './movies'

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

const prisma = new PrismaClient()
const port = '3001'
const app = server.listen(port, () =>
  console.log(`Listening on port ${port}...`)
)

// define the shape of the params passed in from the consumer
type HasMovieWithSpecificIDParams = Omit<MovieType, 'name' | 'year'>
type ExistingMovieParams = Omit<MovieType, 'id'>

const stateHandlers: StateHandlers & MessageStateHandlers = {
  'Has a movie with a specific ID': async (params: AnyJson) => {
    const { id } = params as HasMovieWithSpecificIDParams

    const movieService = new Movie()

    // Check if the movie with the given id already exists
    const existingMovie = await movieService.getMovieById(id)

    if (!existingMovie) {
      // If the movie doesn't exist, create it
      const movieData: Omit<MovieType, 'id'> = {
        name: `Movie Title ${Math.random().toString(36).substring(7)}`,
        year: 2022
      }

      await movieService.addMovie(movieData, id)
      console.log(`Movie with ID ${id} successfully created.`)
    } else {
      console.log(`Movie with ID ${id} already exists, skipping creation.`)
    }

    return {
      description: `Movie with ID ${id} is set up.`
    }
  },
  'An existing movie exists': async (params: AnyJson) => {
    const { name, year } = params as ExistingMovieParams
    const movie = { name, year }

    const movieService = new Movie()
    // Insert the movie
    await movieService.addMovie(movie)

    return {
      description: `Movie with name ${movie.name} added!`
    }
  }
}

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

  afterAll(async () => {
    await prisma.$disconnect()
    app.close()
  })

  it('should validate the expectations of movie-consumer', async () => {
    // 3) Write & execute the provider contract test (you have to return)
    const output = await verifier.verifyProvider()
    console.log('Pact Verification Complete!')
    console.log('Result:', output)
  })
})
