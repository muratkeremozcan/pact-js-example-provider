import { providerWithMetadata } from '@pact-foundation/pact'
import type { Movie } from '@prisma/client'
import { produceMovieEvent } from '../events/movie-events'
import { generateMovie } from './factories'

const movie: Movie = { id: 7, ...generateMovie() }

// These are the messages the provider should produce based on consumer contracts.
// Each key is an event (e.g., 'movie-created') linked to a handler (providerWithMetadata) that generates the message.
// Metadata like contentType ensures correct message format interpretation.

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
