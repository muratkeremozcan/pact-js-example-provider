import {
  OpenAPIRegistry,
  OpenApiGeneratorV31
} from '@asteasolutions/zod-to-openapi'
import {
  CreateMovieSchema,
  CreateMovieResponseSchema,
  GetMovieResponseUnionSchema
} from '../@types/schema'

// OpenAPI Registry: to manage schemas
// OpenApiGeneratorV3 to generate the OpenAPI documentation.

const registry = new OpenAPIRegistry()
// Register schemas in the registry
registry.register('CreateMovieRequest', CreateMovieSchema)
registry.register('CreateMovieResponse', CreateMovieResponseSchema)
registry.register('GetMovieResponse', GetMovieResponseUnionSchema)

// Generate OpenAPI document
const generator = new OpenApiGeneratorV31(registry.definitions)
export const openApiDoc = generator.generateDocument({
  openapi: '3.1.0',
  info: {
    title: 'Movies API',
    version: '1.0.0',
    description: 'API for managing movies'
  },
  servers: [{ url: '/api' }]
})
