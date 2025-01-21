import { test as base, mergeTests } from '@playwright/test'
import { test as apiRequestFixture } from './fixtures/api-request-fixture'
import { test as crudHelperFixtures } from './fixtures/crud-helper-fixture'
import { test as failOnJSError } from './fixtures/fail-on-js-error'

// Merge the fixtures
const test = mergeTests(apiRequestFixture, crudHelperFixtures, failOnJSError) // Add new fixtures as arguments

const expect = base.expect
export { test, expect }
