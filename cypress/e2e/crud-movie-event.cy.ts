import '@cypress/skip-test/support'
import 'cypress-ajv-schema-validator'

import type { Movie } from '@prisma/client'
import spok from 'cy-spok'
import schema from '../../src/api-docs/openapi.json'
import { generateMovieWithoutId } from '../../src/test-helpers/factories'
import { parseKafkaEvent } from '../support/parse-kafka-event'
import { retryableBefore } from '../support/retryable-before'
import { recurse } from 'cypress-recurse'

describe('CRUD movie', () => {
  const movie = generateMovieWithoutId()
  const updatedMovie = generateMovieWithoutId()
  const movieProps: Omit<Movie, 'id'> = {
    name: spok.string,
    year: spok.number,
    rating: spok.number
  }

  let token: string

  retryableBefore(() => {
    // if kafka UI is not running, skip the test
    cy.exec(
      `curl -s -o /dev/null -w "%{http_code}" ${Cypress.env('KAFKA_UI_URL')}`,
      {
        failOnNonZeroExit: false
      }
    ).then((res) => {
      cy.log('**npm run kafka:start to enable this test**')
      cy.skipOn(res.stdout !== '200')
    })

    cy.maybeGetToken('token-session').then((t) => {
      token = t
    })
  })

  it('should crud', () => {
    cy.addMovie(token, movie)
      .validateSchema(schema, {
        endpoint: '/movies',
        method: 'POST'
      })
      .its('body')
      .should(
        spok({
          status: 200,
          data: movieProps
        })
      )
      .its('data.id')
      .then((id) => {
        // this can work when setTimeout is 0, or if sync event, if longer than that, it will fail
        // parseKafkaEvent(id, 'movie-created').should(
        //   spok([
        //     {
        //       topic: 'movie-created',
        //       key: String(id),
        //       movie: { ...movieProps, id }
        //     }
        //   ])
        // )
        // in the real world, the events will take place asynchronously
        // unlike our naive file write check
        // therefore we have to assert things via recursive assertions
        recurse(
          () => parseKafkaEvent(id, 'movie-created'),
          spok([
            {
              topic: 'movie-created',
              key: String(id),
              movie: { ...movieProps, id }
            }
          ])
        )

        cy.getAllMovies(token)
          .validateSchema(schema, {
            endpoint: '/movies',
            method: 'GET'
          })
          .its('body')
          .should(
            spok({
              status: 200,
              data: spok.array
            })
          )
          .findOne({ name: movie.name })

        cy.getMovieById(token, id)
          .validateSchema(schema, {
            endpoint: '/movies/{id}',
            method: 'GET'
          })
          .its('body')
          .should(
            spok({
              status: 200,
              data: {
                ...movieProps,
                id
              }
            })
          )
          .its('data.name')
          .then((name) => {
            cy.getMovieByName(token, name)
              .validateSchema(schema, {
                endpoint: '/movies',
                method: 'GET'
              })
              .its('body')
              .should(
                spok({
                  status: 200,
                  data: {
                    ...movieProps
                  }
                })
              )
          })

        cy.updateMovie(token, id, updatedMovie)
          .validateSchema(schema, {
            endpoint: '/movies/{id}',
            method: 'PUT',
            status: 200
          })
          .its('body')
          .should(
            spok({
              status: 200,
              data: {
                ...movieProps,
                id
              }
            })
          )

        recurse(
          () => parseKafkaEvent(id, 'movie-updated'),
          spok([
            {
              topic: 'movie-updated',
              key: String(id),
              movie: { ...movieProps, id }
            }
          ])
        )

        cy.deleteMovie(token, id)
          .validateSchema(schema, {
            endpoint: '/movies/{id}',
            method: 'DELETE',
            status: 200
          })
          .its('body')
          .should(
            spok({
              status: 200,
              message: spok.string
            })
          )

        recurse(
          () => parseKafkaEvent(id, 'movie-deleted'),
          spok([
            {
              topic: 'movie-deleted',
              key: String(id),
              movie: { id, ...movieProps }
            }
          ])
        )

        cy.getAllMovies(token).findOne({ name: movie.name }).should('not.exist')

        cy.log('**delete non existing movie**')
        cy.deleteMovie(token, id, true)
          .validateSchema(schema, {
            endpoint: '/movies/{id}',
            method: 'DELETE',
            status: 404
          })
          .its('body')
          .should(
            spok({
              status: 404,
              error: spok.string
            })
          )
      })
  })
})
