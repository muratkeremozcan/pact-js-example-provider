import { baseConfig } from './base.config'
import merge from 'lodash/merge'
import { config as dotenvConfig } from 'dotenv'
import path from 'node:path'

dotenvConfig({
  path: path.resolve(__dirname, '../../.env')
})

const BASE_URL = `http://localhost:${process.env.PORT}`

export default merge({}, baseConfig, {
  use: {
    baseURL: BASE_URL
  },
  webServer: {
    command: 'npm run start',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe'
  }
})
