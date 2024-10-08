/* eslint-disable @typescript-eslint/no-var-requires */
import { defineConfig } from 'cypress'
import { baseConfig } from './base.config'
import path from 'node:path'
import merge from 'lodash/merge'
import { config as dotenvConfig } from 'dotenv'

dotenvConfig({
  path: path.resolve(__dirname, '../../.env')
})

// for Optic capture: running e2e against openapi spec for api coverage
const BASE_URL =
  process.env.OPTIC_PROXY || `http://localhost:${process.env.PORT}`

const config = {
  e2e: {
    env: {
      ENVIRONMENT: 'local'
      // enableMismatchesOnUI: true
      // disableSchemaValidation: true
    },
    baseUrl: BASE_URL
  }
}
export default defineConfig(merge({}, baseConfig, config))
