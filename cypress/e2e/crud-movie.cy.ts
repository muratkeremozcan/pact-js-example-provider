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
      // .validateSchema(schema, {
      //   path: '#/components/schemas/CreateMovieResponse',
      //   endpoint: '/movies',
      //   method: 'POST'
      // })
      .should(
        spok({
          status: 200,
          body: movieProps
        })
      )
      .its('body.id')
      .then((id) => {
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

        cy.getMovieById(id)
          .validateSchema(schema, {
            path: '#/components/schemas/GetMovieResponse',
            endpoint: '/movie/{id}',
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
            path: '#/components/schemas/DeleteMovieMessage',
            endpoint: '/movie/{id}',
            method: 'DELETE'
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
      })
  })
})
