import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

// Zod Key feature 1: define the schema with Zod

// OpenAPI Integration: Each field is annotated with OpenAPI-specific metadata
// such as example and description.
// Registry and Generator: We're using the OpenAPIRegistry to manage schemas
// and OpenApiGeneratorV3 to generate the OpenAPI documentation.

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z)

export const CreateMovieSchema = z
  .object({
    id: z.number().optional().openapi({ example: 1, description: 'Movie ID' }),
    name: z
      .string()
      .openapi({ example: 'Inception', description: 'Movie name' }),
    year: z
      .number()
      .int()
      .min(1900)
      .max(2024)
      .openapi({ example: 2010, description: 'Release year' })
  })
  .openapi('CreateMovieRequest')

export const CreateMovieResponseSchema = z
  .object({
    status: z
      .number()
      .int()
      .openapi({ example: 200, description: 'Response status code' }),
    error: z
      .string()
      .optional()
      .openapi({ description: 'Error message, if any' }),
    movie: z
      .object({
        id: z.number().openapi({ example: 1, description: 'Movie ID' }),
        name: z
          .string()
          .openapi({ example: 'Inception', description: 'Movie name' }),
        year: z.number().openapi({ example: 2010, description: 'Release year' })
      })
      .nullable() // Movie can be null
      .optional() // Make movie optional as well
      .openapi({ description: 'Movie data or null' })
  })
  .openapi('CreateMovieResponse')

const movieObj = {
  id: z.number(),
  name: z.string(),
  year: z.number()
}
export const GetMovieResponseUnionSchema = z
  .union([
    // Use union to handle both single and array responses
    z.object(movieObj).nullable(),
    z.array(z.object(movieObj))
  ])
  .openapi('GetMovieResponse')
