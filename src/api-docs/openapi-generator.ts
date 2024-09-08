import {
  OpenAPIRegistry,
  OpenApiGeneratorV31
} from '@asteasolutions/zod-to-openapi'
import {
  CreateMovieSchema,
  CreateMovieResponseSchema,
  GetMovieResponseUnionSchema
} from '../@types/schema'

// this file registers the schemas and generates the OpenAPI document.
// It’s the logic responsible for creating the OpenAPI structure
// based on the Zod schemas.

// 2) Register Schemas with the OpenAPI Registry
const registry = new OpenAPIRegistry()
registry.register('CreateMovieRequest', CreateMovieSchema)
registry.register('CreateMovieResponse', CreateMovieResponseSchema)
registry.register('GetMovieResponse', GetMovieResponseUnionSchema)

// 3) Generate OpenAPI document
const generator = new OpenApiGeneratorV31(registry.definitions)
export const openApiDoc = generator.generateDocument({
  openapi: '3.1.0',
  info: {
    title: 'Movies API',
    version: '1.0.0',
    description: 'API for managing movies'
  },
  servers: [{ url: '/api' }]
})

/*
Steps to Generate OpenAPI Docs with Zod (For Express, Lambda, or any other framework):

1) Define Schemas: src/@types/schema.ts
2) Register Schemas with the OpenAPI Registry

3) Generate OpenAPI Document: Use OpenApiGeneratorV31 to generate the full OpenAPI document. 
This document can be serialized to JSON or YAML and served by our API or Lambda function.

4.a) Static File Generation: If you prefer to generate the OpenAPI documentation as a static file (e.g., JSON or YAML), 
you can do this during our build process:

// json 
import fs from 'fs';
import { openApiDoc } from './doc-generator';

fs.writeFileSync('openapi.json', JSON.stringify(openApiDoc, null, 2));


// yml (npm install yaml)
import fs from 'fs';
import { openApiDoc } from './doc-generator';  // Our OpenAPI document
import { stringify } from 'yaml';

// Convert the OpenAPI document to YAML format
const yamlDoc = stringify(openApiDoc);

// Write the YAML file
fs.writeFileSync('openapi.yml', yamlDoc);

console.log('OpenAPI documentation generated in YAML format');

4.b) Serving the OpenAPI Document (For Express): If you're using Express, 
you can serve the generated OpenAPI document through an endpoint using middleware like swagger-ui-express.

4.c) Generating and Serving in Lambda (or Serverless Environments): For Lambda, or any serverless environment, 
you'll generate the OpenAPI document as part of our deployment/build process a
nd serve it either as a static JSON file or through an HTTP API.

import { APIGatewayProxyHandler } from 'aws-lambda'
import { openApiDoc } from './doc-generator'  // Our OpenAPI document

export const getDocs: APIGatewayProxyHandler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(openApiDoc),
  }
}

*/
