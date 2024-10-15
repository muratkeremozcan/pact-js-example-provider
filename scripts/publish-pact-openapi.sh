#!/bin/bash

# Load environment variables
. ./scripts/env-setup.sh

# Publish the provider OpenAPI contract to Pactflow
pactflow publish-provider-contract \
    src/api-docs/openapi.json \
    --provider MoviesAPI-bi-directional \
    --provider-app-version=$GITHUB_SHA \
    --branch=$GITHUB_BRANCH \
    --content-type application/json \
    --verification-exit-code=0 \
    --verification-results ./cypress/verification-result.txt \
    --verification-results-content-type text/plain \
    --verifier cypress
