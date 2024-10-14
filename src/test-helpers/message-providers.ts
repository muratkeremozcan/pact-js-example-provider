import { providerWithMetadata } from '@pact-foundation/pact'
import type { Movie } from '@prisma/client'
import { produceMovieEvent } from '../events/movie-events'
import { generateMovie } from './factories'

const movie: Movie = { id: 7, ...generateMovie() }

// These are the "expected messages" the provider is expected to produce based on consumer contracts.
// Each key represents a specific event (e.g., 'a movie-created event') and is associated with a pact's handler function
// `providerWithMetadata` that generates and returns the expected message content.
// The metadata, such as `contentType`, is provided to ensure correct interpretation of the message format.

export const messageProviders = {
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
}
