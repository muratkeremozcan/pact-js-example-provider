import type { UserData } from './support/register-login-user'
import type { Movie } from '@prisma/client'

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
    }
  }
}
