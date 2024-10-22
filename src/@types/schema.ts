import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

// Zod Key feature 1: define the schema with Zod (and expand it with zod-to-openapi)

// Generate OpenAPI Docs with Zod step 1) Define Schemas (with zod)
// Each field is annotated with OpenAPI-specific metadata such as example and description.

// extends Zod with OpenAPI support
extendZodWithOpenApi(z)

// Define common fields
const movieFields = {
  id: z.number().int().openapi({ example: 1, description: 'Movie ID' }),
  name: z.string().openapi({ example: 'Inception', description: 'Movie name' }),
  year: z
    .number()
    .int()
    .openapi({ example: 2010, description: 'Release year' }),
  rating: z.number().openapi({ example: 7.5, description: 'Rating' })
}

// Create schemas
export const CreateMovieSchema = z
  .object({
    ...movieFields,
    id: movieFields.id.optional(),
    name: movieFields.name.min(1),
    year: movieFields.year.min(1900).max(2024)
  })
  .openapi('CreateMovieRequest')

export const CreateMovieResponseSchema = z
  .object({
    status: z
      .number()
      .int()
      .openapi({ example: 200, description: 'Response status code' }),
    data: z.object(movieFields).openapi({ description: 'Movie data' }),
    error: z
      .string()
      .optional()
      .openapi({ description: 'Error message, if any' })
  })
  .openapi('CreateMovieResponse')

export const ConflictMovieResponseSchema = z.object({
  status: z
    .number()
    .int()
    .openapi({ example: 409, description: 'Conflict status code' }),
  error: z
    .string()
    .openapi({ example: 'Movie already exists', description: 'Error message' })
})

export const GetMovieResponseUnionSchema = z
  .object({
    status: z
      .number()
      .int()
      .openapi({ example: 200, description: 'Response status code' }),
    data: z
      .union([z.object(movieFields).nullable(), z.array(z.object(movieFields))])
      .openapi({
        description: 'Movie details, list of movies, or null if not found',
        example: { id: 1, name: 'Inception', year: 2010, rating: 7.5 }
      }),
    error: z.string().nullable().optional().openapi({
      description: 'Error message if an error occurred, otherwise null',
      example: null
    })
  })
  .openapi('GetMovieResponse')

export const MovieNotFoundResponseSchema = z.object({
  status: z
    .number()
    .int()
    .openapi({ example: 404, description: 'Response status code' }),
  error: z
    .string()
    .openapi({ example: 'Movie not found', description: 'Error message' })
})

export const DeleteMovieResponseSchema = z
  .object({
    status: z
      .number()
      .int()
      .openapi({ example: 200, description: 'Response status code' }),
    message: z.string().openapi({
      example: 'Movie {id} has been deleted',
      description: 'Success message for the deleted movie'
    })
  })
  .openapi('DeleteMovieResponse')

export const UpdateMovieSchema = z
  .object({
    ...movieFields,
    id: movieFields.id.optional(),
    name: z.string().min(1).optional(),
    year: z.number().int().min(1900).max(2024).optional(),
    rating: movieFields.rating.optional()
  })
  .openapi('UpdateMovieRequest')

export const UpdateMovieResponseSchema = z
  .object({
    status: z
      .number()
      .int()
      .openapi({ example: 200, description: 'Response status code' }),
    data: z.object(movieFields).openapi({ description: 'Updated movie data' }),
    error: z
      .string()
      .optional()
      .openapi({ description: 'Error message, if any' })
  })
  .openapi('UpdateMovieResponse')
