import type { UserData } from './support/register-login-user'
import type { Movie } from '@prisma/client'
import type { OpenAPIV31 } from 'openapi-types'

export {}

declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      /** Gets a list of movies
       * ```js
       * cy.getAllMovies()
       * ```
       */
      getAllMovies(
        allowedToFail?: boolean
      ): Chainable<Response<Movie[]> & Messages>

      /** Gets a movie by id
       * ```js
       * cy.getMovieById(1)
       * ```
       */
      getMovieById(
        id: number,
        allowedToFail?: boolean
      ): Chainable<Response<Movie> & Messages>

      /** Creates a movie
       * ```js
       * cy.addMovie({name: 'The Great Gatsby', year: 1925  })
       * ```
       */
      addMovie(
        body: Omit<Movie, 'id'>,
        allowedToFail?: boolean
      ): Chainable<Response<Omit<Movie, 'id'>> & Messages>

      /** Deletes a movie
       * ```js
       * cy.deleteMovie(1)
       * ```
       */
      deleteMovie(
        id: number,
        allowedToFail?: boolean
      ): Chainable<Response<Movie> & Messages>

      /**
       * Validates the response body against the provided schema.
       *
       * @param schema - OpenAPI schema object to validate against.
       * @param options - Endpoint and method information for the schema, with optional path and status.
       *
       * @example
       * ```js
       * cy.validateSchema(schema, {
       *   endpoint: '/movies',
       *   method: 'POST'
       * })
       * ```
       *
       * You can optionally specify `path` and `status`:
       *
       * @example
       * ```js
       * cy.validateSchema(schema, {
       *   endpoint: '/movies',
       *   method: 'POST',
       *   status: 201 // Defaults to 200 if not provided
       * })
       * ``` */
      validateSchema(
        schema: OpenAPIV3.SchemaObject,
        options: {
          path?: string
          endpoint: string
          method: string
          status?: string | number
        }
      ): Chainable<Subject>
    }
  }
}
