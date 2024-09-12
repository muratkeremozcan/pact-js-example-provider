import 'cypress-ajv-schema-validator'
import type { Movie } from '@prisma/client'
import { generateMovie } from '../support/factories'
import spok from 'cy-spok'
import schema from '../../src/api-docs/openapi.json'

describe('CRUD movie', () => {
  const movie = generateMovie()
  const movieProps: Omit<Movie, 'id'> = {
    name: spok.string,
    year: spok.number
  }

  it('should crud', () => {
    // Add movie
    cy.addMovie(movie)
      .validateSchema(schema, {
        path: '#/components/schemas/CreateMovieResponse',
        endpoint: '/movies',
        method: 'POST'
      })
      .should(
        spok({
          status: 200,
          body: movieProps
        })
      )
      .its('body.movie.id') // Adjust for CreateMovieResponse schema
      .then((id) => {
        // Get all movies
        cy.getAllMovies()
          .validateSchema(schema, {
            path: '#/components/schemas/GetMovieResponse',
            endpoint: '/movies',
            method: 'GET'
          })
          .should(
            spok({
              status: 200,
              body: spok.array
            })
          )
          .its('body')
          .findOne({ name: movie.name })

        // Get movie by ID
        cy.getMovieById(id)
          .validateSchema(schema, {
            path: '#/components/schemas/GetMovieResponse',
            endpoint: `/movie/${id}`,
            method: 'GET'
          })
          .should(
            spok({
              status: 200,
              body: {
                ...movieProps,
                id
              }
            })
          )

        // Delete movie
        cy.deleteMovie(id).validateSchema(schema, {
          path: '#/components/schemas/DeleteMovieMessage',
          endpoint: `/movie/${id}`,
          method: 'DELETE'
        })

        // Validate movie deletion
        cy.getAllMovies()
          .its('body')
          .findOne({ name: movie.name })
          .should('not.exist')
      })
  })
})
