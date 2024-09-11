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
    const existingMovie = await movieService.getMovieById(id)

    if (!existingMovie) {
      // If the movie doesn't exist, create it
      const movieData: Omit<Movie, 'id'> = {
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

    // Check if the movie already exists by name
    const existingMovie = await movieService.getMovieByName(name)

    if (!existingMovie) {
      // Insert the movie if it doesn't exist
      await movieService.addMovie({ name, year })
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
  }
}
