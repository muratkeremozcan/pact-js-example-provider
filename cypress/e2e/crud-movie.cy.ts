import 'cypress-ajv-schema-validator'
import type { Movie } from '@prisma/client'
import { generateMovie } from '../support/factories'
import spok from 'cy-spok'
import schema from '../../src/api-docs/openapi.json'

Cypress.Commands.overwrite('validateSchema', (originalFn, schema, options) => {
  cy.log('Schema validation is disabled for now')
  // Return the original Cypress chain, which effectively skips the validation
  return originalFn(schema, options)
})

describe('CRUD movie', () => {
  const movie = generateMovie()
  const updatedMovie = generateMovie()
  const movieProps: Omit<Movie, 'id'> = {
    name: spok.string,
    year: spok.number
  }

  it('should crud', () => {
    cy.addMovie(movie)
      .should(
        spok({
          status: 200,
          data: movieProps
        })
      )
      .validateSchema(schema, {
        endpoint: '/movies',
        method: 'POST'
      })
      .its('data.id')
      .then((id) => {
        cy.getAllMovies()
          .should(
            spok({
              status: 200,
              data: spok.array
            })
          )
          .validateSchema(schema, {
            endpoint: '/movies',
            method: 'GET'
          })
          .findOne({ name: movie.name })

        cy.getMovieById(id)
          .should(
            spok({
              status: 200,
              data: {
                ...movieProps,
                id
              }
            })
          )
          .validateSchema(schema, {
            endpoint: '/movies/{id}',
            method: 'GET'
          })
          .its('data.name')
          .then((name) => {
            cy.getMovieByName(name)
              .should(
                spok({
                  status: 200,
                  data: {
                    ...movieProps
                  }
                })
              )
              .validateSchema(schema, {
                endpoint: '/movies',
                method: 'GET'
              })
          })

        cy.updateMovie(id, updatedMovie)
          .should(
            spok({
              status: 200,
              data: {
                ...movieProps,
                id
              }
            })
          )
          .validateSchema(schema, {
            endpoint: '/movies/{id}',
            method: 'PUT',
            status: 200
          })

        cy.deleteMovie(id)
          .should(
            spok({
              status: 200,
              message: spok.string
            })
          )
          .validateSchema(schema, {
            endpoint: '/movies/{id}',
            method: 'DELETE',
            status: 200
          })

        cy.getAllMovies().findOne({ name: movie.name }).should('not.exist')

        cy.log('**delete non existing movie**')
        cy.deleteMovie(id, true) // allowedToFail
          .should(
            spok({
              status: 404,
              message: spok.string
            })
          )
          .validateSchema(schema, {
            endpoint: '/movies/{id}',
            method: 'DELETE',
            status: 404
          })
      })
  })
})
