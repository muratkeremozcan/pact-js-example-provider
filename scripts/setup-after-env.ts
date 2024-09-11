import { truncateTables } from './truncate-tables'

beforeEach(async () => {
  console.log('Running before each test...')
  await truncateTables()
})
