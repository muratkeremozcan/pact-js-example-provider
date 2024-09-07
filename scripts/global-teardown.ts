import { truncateTables } from './truncate-tables'

export default async function globalTeardown(): Promise<void> {
  console.log('Running global teardown...')
  await truncateTables()
}
