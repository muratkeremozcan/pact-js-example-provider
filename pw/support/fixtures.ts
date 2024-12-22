import { test as base, mergeTests } from '@playwright/test'
import { test as apiRequestFixture } from './helpers/api-request-fixture'
import { test as crudHelperFixtures } from './helpers/crud-helper-fixture'
// import { test }

// Merge the fixtures
const test = mergeTests(apiRequestFixture, crudHelperFixtures) // Add new fixtures as arguments

const expect = base.expect
export { test, expect }
