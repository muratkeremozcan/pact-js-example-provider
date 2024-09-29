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
    cy.addMovie(movie)
      .validateSchema(schema, {
        endpoint: '/movies',
        method: 'POST'
      })
      .its('body')
      .should(
        spok({
          status: 200,
          movie: movieProps
        })
      )
      .its('movie.id')
      .then((id) => {
        cy.getAllMovies()
          .validateSchema(schema, {
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

        cy.getMovieById(id)
          .validateSchema(schema, {
            endpoint: '/movies/{id}',
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

        cy.deleteMovie(id)
          .validateSchema(schema, {
            endpoint: '/movies/{id}',
            method: 'DELETE',
            status: 200
          })
          .should(
            spok({
              status: 200,
              body: {
                message: spok.string
              }
            })
          )

        cy.getAllMovies()
          .its('body')
          .findOne({ name: movie.name })
          .should('not.exist')

        cy.log('**delete non existing movie**')
        cy.deleteMovie(id, true) // allowedToFail
          .validateSchema(schema, {
            endpoint: '/movies/{id}',
            method: 'DELETE',
            status: 404
          })
          .should(
            spok({
              status: 404,
              body: {
                error: spok.string
              }
            })
          )
      })
  })
})
