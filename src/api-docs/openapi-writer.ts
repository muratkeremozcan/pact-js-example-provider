import fs from 'node:fs'
import path from 'node:path'
import { stringify } from 'yaml'
import { openApiDoc } from './openapi-generator' // Your OpenAPI document

// Convert the OpenAPI document to YAML format
const yamlDoc = stringify(openApiDoc)

const scriptDir = path.resolve(__dirname)

// Write the YAML file
fs.writeFileSync(`${scriptDir}/openapi.yml`, yamlDoc)

console.log('OpenAPI documentation generated in YAML format')
