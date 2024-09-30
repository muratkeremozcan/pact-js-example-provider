import './commands'
import 'cypress-map'
import '@bahmutov/cy-api'
import type { Movie } from '@prisma/client'

Cypress.Commands.add('getAllMovies', (allowedToFail = false) => {
  cy.log('**getAllMovies**')
  return cy.api({
    method: 'GET',
    url: '/movies',
    retryOnStatusCodeFailure: !allowedToFail,
    failOnStatusCode: !allowedToFail
  })
})

Cypress.Commands.add('getMovieById', (id: number, allowedToFail = false) => {
  cy.log(`**getMovieById: ${id}**`)
  return cy.api({
    method: 'GET',
    url: `/movies/${id}`,
    retryOnStatusCodeFailure: !allowedToFail,
    failOnStatusCode: !allowedToFail
  })
})

Cypress.Commands.add(
  'getMovieByName',
  (name: string, allowedToFail = false) => {
    cy.log(`**getMovieByName: ${name}**`)
    return cy.api({
      method: 'GET',
      url: '/movies',
      qs: { name },
      retryOnStatusCodeFailure: !allowedToFail,
      failOnStatusCode: !allowedToFail
    })
  }
)

Cypress.Commands.add(
  'addMovie',
  (body: Omit<Movie, 'id'>, allowedToFail = false) => {
    cy.log('**addMovie**')
    return cy.api({
      method: 'POST',
      url: '/movies',
      body: body,
      retryOnStatusCodeFailure: !allowedToFail,
      failOnStatusCode: !allowedToFail
    })
  }
)

Cypress.Commands.add('deleteMovie', (id: number, allowedToFail = false) => {
  cy.log('**deleteMovie by id: ${id}**')
  return cy.api({
    method: 'DELETE',
    url: `/movies/${id}`,
    retryOnStatusCodeFailure: !allowedToFail,
    failOnStatusCode: !allowedToFail
  })
})
