import { test as base, mergeTests } from '@playwright/test'
import { test as apiRequestFixture } from './fixtures/api-request-fixture'
import { test as crudHelperFixtures } from './fixtures/crud-helper-fixture'
import { test as authFixture } from './fixtures/auth-fixture'

// Merge the fixtures
const test = mergeTests(apiRequestFixture, crudHelperFixtures, authFixture)

const expect = base.expect
export { test, expect }
