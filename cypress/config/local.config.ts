/* eslint-disable @typescript-eslint/no-var-requires */
import { defineConfig } from 'cypress'
import { baseConfig } from './base.config'
import path from 'node:path'
import merge from 'lodash/merge'

require('dotenv').config({
  path: path.resolve(__dirname, '../../.env')
})

const config = {
  e2e: {
    env: {
      ENVIRONMENT: 'local'
    },
    baseUrl: `http://localhost:${process.env.PORT}`
  }
}

export default defineConfig(merge({}, baseConfig, config))
