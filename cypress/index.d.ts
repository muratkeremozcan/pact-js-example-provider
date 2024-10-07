import type { UserData } from './support/register-login-user'
import type { Movie } from '@prisma/client'
import type { OpenAPIV31 } from 'openapi-types'
import type {
  UpdateMovieResponse,
  CreateMovieResponse,
  MovieNotFoundResponse,
  ConflictMovieResponse,
  GetMovieResponse,
  DeleteMovieResponse
} from './@types'

export {}

declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      /** Gets a list of movies
       * ```js
       * cy.getAllMovies(token)
       * ```
       */
      getAllMovies(
        token: string,
        allowedToFail?: boolean
      ): Chainable<GetMovieResponse>

      /** Gets a movie by id
       * ```js
       * cy.getMovieById(token, 1)
       * ```
       */
      getMovieById(
        token: string,
        id: number,
        allowedToFail?: boolean
      ): Chainable<GetMovieResponse>

      /** Gets a movie by name
       * ```js
       * cy.getMovieByName(token, 'The Great Gatsby')
       * ```
       */
      getMovieByName(
        token: string,
        name: string,
        allowedToFail?: boolean
      ): Chainable<GetMovieResponse>

      /** Creates a movie
       * ```js
       * cy.addMovie({name: 'The Great Gatsby', year: 1925  })
       * ```
       */
      addMovie(
        token: string,
        body: Omit<Movie, 'id'>,
        allowedToFail?: boolean
      ): Chainable<CreateMovieResponse>

      /** Updates a movie by id
       * ```js
       * cy.updateMovie(1, {name: 'The Great Gatsby Updated'})
       * ```
       */
      updateMovie(
        token: string,
        id: number,
        body: Partial<Movie>
      ): Chainable<UpdateMovieResponse>

      /** Deletes a movie
       * ```js
       * cy.deleteMovie(1)
       * ```
       */
      deleteMovie(
        token: string,
        id: number,
        allowedToFail?: boolean
      ): Chainable<DeleteMovieResponse>

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

      /**
       * If the token exists, reuses it
       * If no token is exists, gets a token
       */
      maybeGetToken(sessionName: string): Chainable<string>
    }
  }
}
