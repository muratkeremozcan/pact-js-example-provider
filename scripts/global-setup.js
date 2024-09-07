// jest.teardown.js
const { truncateTables } = require('./truncate-tables')

module.exports = async () => {
  console.log('Running global setup...')
  await truncateTables()
}
