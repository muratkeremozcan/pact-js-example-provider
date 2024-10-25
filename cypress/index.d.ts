import type { Movie } from '@prisma/client'
import type {
  UpdateMovieResponse,
  CreateMovieResponse,
  GetMovieResponse,
  DeleteMovieResponse
} from './@types'
import type { OpenAPIV3_1 } from 'openapi-types'

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
        schema: OpenAPIV3_1.Document,
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

      /** https://www.npmjs.com/package/@cypress/skip-test
       * `cy.skipOn('localhost')` */
      skipOn(
        nameOrFlag: string | boolean | (() => boolean),
        cb?: () => void
      ): Chainable<Subject>

      /** https://www.npmjs.com/package/@cypress/skip-test
       * `cy.onlyOn('localhost')` */
      onlyOn(
        nameOrFlag: string | boolean | (() => boolean),
        cb?: () => void
      ): Chainable<Subject>
    }
  }
}
