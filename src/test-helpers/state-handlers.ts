import type { MessageStateHandlers } from '@pact-foundation/pact'
import type { AnyJson } from '@pact-foundation/pact/src/common/jsonTypes'
import type { StateHandlers } from '@pact-foundation/pact/src/dsl/verifier/proxy/types'
import { PrismaClient, type Movie } from '@prisma/client'
import { MovieService } from '../movie-service'
import { MovieAdapter } from '../movie-adapter'
import { truncateTables } from '../../scripts/truncate-tables'

// define the shape of the params passed in from the consumer
type HasMovieWithSpecificIDParams = Omit<Movie, 'name' | 'year'>
type ExistingMovieParams = Omit<Movie, 'id'>

const prisma = new PrismaClient()
const movieAdapter = new MovieAdapter(prisma)
const movieService = new MovieService(movieAdapter)

export const stateHandlers: StateHandlers & MessageStateHandlers = {
  'Has a movie with a specific ID': async (params: AnyJson) => {
    const { id } = params as HasMovieWithSpecificIDParams

    // Check if the movie with the given id already exists
    const res = await movieService.getMovieById(id)

    if (res.status !== 200) {
      // If the movie doesn't exist, create it
      const movieData: Omit<Movie, 'id'> = {
        name: `Movie Title ${Math.random().toString(36).substring(7)}`,
        year: 2022,
        rating: 7.5,
        director: `Movie Director ${Math.random().toString(36).substring(7)}`,
        oscar: true
      }
      console.log('MOVIE DATA:', movieData)

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
    const { name, year, rating, director, oscar } =
      params as ExistingMovieParams

    // Check if the movie already exists by name
    const res = await movieService.getMovieByName(name)

    if (res.status !== 200) {
      // Insert the movie if it doesn't exist
      await movieService.addMovie({ name, year, rating, director, oscar })
      console.log(`Movie with name "${name}" added.`)
    } else {
      console.log(
        `Movie with name "${name}" already exists, skipping creation.`
      )
    }

    return {
      description: `Movie with name "${name}" is set up.`
    }
  },
  'No movies exist': async () => {
    console.log('Truncating tables...')
    await truncateTables()

    return {
      description: 'State with no movies achieved.'
    }
  }

  // // @ts-expect-error: https://github.com/pact-foundation/pact-js/issues/1164
  // 'No movies exist': {
  //   setup: async () => {
  //     console.log('Truncating tables...')
  //     await truncateTables()
  //   },
  //   teardown: async () => {
  //     console.log('Teardown of state No movies exist ran...')
  //     // Logic to restore default movies or clean up further can go here.
  //     // If you're using fixtures or need to reset the database, handle that here.
  //   }
  // }
}

/*
 Note about PROVIDER STATES: we can simulate certain states of the API (like an empty or non-empty DB)
 in order to cover different scenarios
 The state could have many more variables; it is a good practice to represent it as an object
 Note that the consumer state name should match the provider side

 * The purpose of the stateHandlers is to ensure that the provider is in the correct state
 to fulfill the consumer's expectations as defined in the contract tests.
 * In a real-world scenario, you would typically set up this state by interacting with your service's database
 * or through an API provided by the service itself (locally).
 * This ensures that the provider test runs in a controlled environment where all the necessary data
 and conditions are met, allowing for accurate verification of the consumer's expectations.

Pact docs mention state setup and teardown
https://docs.pact.io/implementation_guides/javascript/docs/provider#provider-state-setup-and-teardown

but it doesn't work with TS at the moment
https://github.com/pact-foundation/pact-js/issues/1164

StateHandlers can either use:

* a single function: this is only used for the setup phase, where you define a function that sets up the provider state. 
It cannot handle teardown.

* an object with separate setup and teardown properties: this allows you to specify distinct functions 
for both the setup and teardown phases. The setup function will initialize the required state, 
and the teardown function will clean up after the tests have run.

What is the distinction between setup & teardown vs beforeEach & afterEach in options?
TL, DR; granularity

afterEach in options runs after every single test
the teardown in stateHandlers runs only after the tests which use that specific state

beforeEach in options runs before every single test
the setup in stateHandlers runs only before the tests which use that specific state

*/
