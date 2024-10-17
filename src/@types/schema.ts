import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

// Zod Key feature 1: define the schema with Zod (and expand it with zod-to-openapi)

// Generate OpenAPI Docs with Zod step 1) Define Schemas (with zod)
// Each field is annotated with OpenAPI-specific metadata such as example and description.

// extends Zod with OpenAPI support
extendZodWithOpenApi(z)

// Director Schema
export const DirectorSchema = z
  .object({
    id: z.number().int().openapi({ example: 1, description: 'Director ID' }),
    name: z
      .string()
      .openapi({ example: 'Christopher Nolan', description: 'Director name' })
  })
  .openapi('Director')

// Actor Schema
export const ActorSchema = z
  .object({
    id: z.number().int().openapi({ example: 1, description: 'Actor ID' }),
    name: z
      .string()
      .openapi({ example: 'Leonardo DiCaprio', description: 'Actor name' })
  })
  .openapi('Actor')

// Genre Schema
export const GenreSchema = z
  .object({
    id: z.number().int().openapi({ example: 1, description: 'Genre ID' }),
    name: z.string().openapi({ example: 'Sci-Fi', description: 'Genre name' })
  })
  .openapi('Genre')

// Movie Schema (used in responses)
const movieObj = {
  id: z.number().int().openapi({ example: 1, description: 'Movie ID' }),
  name: z.string().openapi({ example: 'Inception', description: 'Movie name' }),
  year: z
    .number()
    .int()
    .openapi({ example: 2010, description: 'Release year' }),
  director: DirectorSchema.nullable()
    .optional()
    .openapi({
      description: 'Director of the movie',
      example: { id: 1, name: 'Christopher Nolan' }
    }),
  actors: z
    .array(ActorSchema)
    .optional()
    .openapi({
      description: 'List of actors in the movie',
      example: [{ id: 1, name: 'Leonardo DiCaprio' }]
    }),
  genres: z
    .array(GenreSchema)
    .optional()
    .openapi({
      description: 'Genres associated with the movie',
      example: [{ id: 1, name: 'Sci-Fi' }]
    })
}

// Create the MovieSchema by wrapping movieObj with z.object()
export const MovieSchema = z.object(movieObj).openapi('Movie')

// Create Movie Request Schema
export const CreateMovieSchema = z
  .object({
    name: z
      .string()
      .min(1)
      .openapi({ example: 'Inception', description: 'Movie name' }),
    year: z
      .number()
      .int()
      .min(1900)
      .max(2024)
      .openapi({ example: 2010, description: 'Release year' }),
    directorId: z
      .number()
      .int()
      .optional()
      .openapi({ example: 1, description: 'Director ID' }),
    actorIds: z
      .array(z.number().int())
      .optional()
      .openapi({
        description: 'List of Actor IDs',
        example: [1, 2]
      }),
    genreIds: z
      .array(z.number().int())
      .optional()
      .openapi({
        description: 'List of Genre IDs',
        example: [1, 2]
      })
  })
  .openapi('CreateMovieRequest')

// Create Movie Response Schema
export const CreateMovieResponseSchema = z
  .object({
    status: z
      .number()
      .int()
      .openapi({ example: 201, description: 'Created status code' }),
    data: z.object(movieObj).openapi({ description: 'Created movie data' }),
    error: z
      .string()
      .optional()
      .openapi({ description: 'Error message, if any' })
  })
  .openapi('CreateMovieResponse')

// Conflict Movie Response Schema
export const ConflictMovieResponseSchema = z
  .object({
    status: z
      .number()
      .int()
      .openapi({ example: 409, description: 'Conflict status code' }),
    error: z.string().openapi({
      example: 'Movie already exists with the same name and year',
      description: 'Conflict error message'
    })
  })
  .openapi('ConflictMovieResponse')

// Get Movie Response Schema (Single Movie)
export const GetMovieResponseSchema = z
  .object({
    status: z
      .number()
      .int()
      .openapi({ example: 200, description: 'OK status code' }),
    data: z
      .object(movieObj)
      .nullable()
      .openapi({
        description: 'Movie details or null if not found',
        example: {
          id: 1,
          name: 'Inception',
          year: 2010,
          director: { id: 1, name: 'Christopher Nolan' },
          actors: [{ id: 1, name: 'Leonardo DiCaprio' }],
          genres: [{ id: 1, name: 'Sci-Fi' }]
        }
      }),
    error: z.string().nullable().optional().openapi({
      description: 'Error message if an error occurred, otherwise null',
      example: null
    })
  })
  .openapi('GetMovieResponse')

// Get Movies Response Schema (List of Movies)
export const GetMoviesResponseSchema = z
  .object({
    status: z
      .number()
      .int()
      .openapi({ example: 200, description: 'OK status code' }),
    data: z.array(MovieSchema).openapi({
      description: 'List of movies or an empty array if no movies exist',
      example: [
        {
          id: 1,
          name: 'Inception',
          year: 2010,
          director: { id: 1, name: 'Christopher Nolan' },
          actors: [{ id: 1, name: 'Leonardo DiCaprio' }],
          genres: [{ id: 1, name: 'Sci-Fi' }]
        }
      ]
    }),
    error: z.string().nullable().optional().openapi({
      description: 'Error message if an error occurred, otherwise null',
      example: null
    })
  })
  .openapi('GetMoviesResponse')

// Movie Not Found Response Schema
export const MovieNotFoundResponseSchema = z
  .object({
    status: z
      .number()
      .int()
      .openapi({ example: 404, description: 'Not Found status code' }),
    error: z
      .string()
      .openapi({ example: 'Movie not found', description: 'Error message' })
  })
  .openapi('MovieNotFoundResponse')

// Delete Movie Response Schema
export const DeleteMovieResponseSchema = z
  .object({
    status: z
      .number()
      .int()
      .openapi({ example: 200, description: 'OK status code' }),
    message: z.string().openapi({
      example: 'Movie {id} has been deleted',
      description: 'Success message for the deleted movie'
    })
  })
  .openapi('DeleteMovieResponse')

// Update Movie Request Schema
export const UpdateMovieSchema = z
  .object({
    name: z
      .string()
      .min(1)
      .optional()
      .openapi({ example: 'Inception', description: 'Movie name' }),
    year: z
      .number()
      .int()
      .min(1900)
      .max(2024)
      .optional()
      .openapi({ example: 2010, description: 'Release year' }),
    directorId: z
      .number()
      .int()
      .nullable()
      .optional()
      .openapi({ example: 1, description: 'Director ID' }),
    actorIds: z
      .array(z.number().int())
      .optional()
      .openapi({
        description: 'List of Actor IDs',
        example: [1, 2]
      }),
    genreIds: z
      .array(z.number().int())
      .optional()
      .openapi({
        description: 'List of Genre IDs',
        example: [1, 2]
      })
  })
  .openapi('UpdateMovieRequest')

// Update Movie Response Schema
export const UpdateMovieResponseSchema = z
  .object({
    status: z
      .number()
      .int()
      .openapi({ example: 200, description: 'OK status code' }),
    data: z.object(movieObj).openapi({ description: 'Updated movie data' }),
    error: z
      .string()
      .optional()
      .openapi({ description: 'Error message, if any' })
  })
  .openapi('UpdateMovieResponse')

// Additional Error Schemas
export const DirectorNotFoundResponseSchema = z
  .object({
    status: z
      .number()
      .int()
      .openapi({ example: 404, description: 'Not Found status code' }),
    error: z
      .string()
      .openapi({ example: 'Director not found', description: 'Error message' })
  })
  .openapi('DirectorNotFoundResponse')

export const ActorNotFoundResponseSchema = z
  .object({
    status: z
      .number()
      .int()
      .openapi({ example: 404, description: 'Not Found status code' }),
    error: z
      .string()
      .openapi({ example: 'Actor not found', description: 'Error message' })
  })
  .openapi('ActorNotFoundResponse')

export const GenreNotFoundResponseSchema = z
  .object({
    status: z
      .number()
      .int()
      .openapi({ example: 404, description: 'Not Found status code' }),
    error: z
      .string()
      .openapi({ example: 'Genre not found', description: 'Error message' })
  })
  .openapi('GenreNotFoundResponse')
