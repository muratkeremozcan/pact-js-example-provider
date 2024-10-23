import fs from 'node:fs'
import path from 'node:path'
import { stringify } from 'yaml'
import { openApiDoc } from './openapi-generator' // Your OpenAPI document

// Generate OpenAPI Docs with Zod step 4

// Convert the OpenAPI document to YML format
const ymlDoc = stringify(openApiDoc)

const scriptDir = path.resolve(__dirname)
// Write the YML file
fs.writeFileSync(`${scriptDir}/openapi.yml`, ymlDoc)

console.log('OpenAPI documentation generated in YML format')

// Json version
// Convert the OpenAPI document to JSON format
const jsonDoc = JSON.stringify(openApiDoc, null, 2) // pretty print with 2 spaces

// Write the JSON file
fs.writeFileSync(`${scriptDir}/openapi.json`, jsonDoc)

console.log('OpenAPI documentation generated in JSON format')
