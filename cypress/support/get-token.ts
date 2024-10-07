import 'cypress-data-session'
const getToken = () =>
  cy.api({ method: 'POST', url: '/auth/fake-token' }).its('body.token')

const maybeGetToken = (sessionName: string) =>
  cy.dataSession({
    name: sessionName,

    validate: () => true,

    setup: () => getToken(),

    shareAcrossSpecs: true
  })
Cypress.Commands.add('maybeGetToken', maybeGetToken)
