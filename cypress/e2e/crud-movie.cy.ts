import type { Movie } from '@prisma/client'
import { generateMovie } from '../support/factories'
import spok from 'cy-spok'

describe('CRUD movie', () => {
  const movie = generateMovie()
  const movieProps: Omit<Movie, 'id'> = {
    name: spok.string,
    year: spok.number
  }

  it('should crud', () => {
    cy.addMovie(movie)
      .should(
        spok({
          status: 200,
          body: movieProps
        })
      )
      .its('body.id')
      .then((id) => {
        cy.getAllMovies()
          .should(
            spok({
              status: 200,
              body: spok.array
            })
          )
          .its('body')
          .findOne({ name: movie.name })

        cy.getMovieById(id).should(
          spok({
            status: 200,
            body: {
              ...movieProps,
              id
            }
          })
        )

        cy.deleteMovie(id)
        cy.getAllMovies()
          .its('body')
          .findOne({ name: movie.name })
          .should('not.exist')
      })
  })
})
