import fs from 'node:fs'
import path from 'node:path'
import { stringify } from 'yaml'
import { openApiDoc } from './openapi-generator' // Your OpenAPI document

// Generate OpenAPI Docs with Zod step 4

// Convert the OpenAPI document to YAML format
const yamlDoc = stringify(openApiDoc)

const scriptDir = path.resolve(__dirname)
// Write the YAML file
fs.writeFileSync(`${scriptDir}/openapi.yml`, yamlDoc)

console.log('OpenAPI documentation generated in YAML format')

// Json version
// Convert the OpenAPI document to JSON format
const jsonDoc = JSON.stringify(openApiDoc, null, 2) // pretty print with 2 spaces

// Write the JSON file
fs.writeFileSync(`${scriptDir}/openapi.json`, jsonDoc)

console.log('OpenAPI documentation generated in JSON format')
