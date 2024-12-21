import { test as base, mergeTests } from '@playwright/test'
import { test as baseFixtures } from './helpers/api-request-fixture'
import { test as crudHelperFixtures } from './helpers/crud-helper-fixtures'
// import { test }

// Merge the fixtures
const test = mergeTests(baseFixtures, crudHelperFixtures) // Add new fixtures as arguments

const expect = base.expect
export { test, expect }
