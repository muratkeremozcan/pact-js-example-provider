#!/bin/bash

# Load environment variables
. ./scripts/env-setup.sh

# Record provider deployment for the main branch
if [ "$GITHUB_BRANCH" = "main" ]; then
  # Record deployment for MoviesAPI
  pact-broker record-deployment \
    --pacticipant MoviesAPI \
    --version $GITHUB_SHA \
    --environment $npm_config_env
  
  # Record deployment for MoviesAPI-event-producer
  pact-broker record-deployment \
    --pacticipant MoviesAPI-event-producer \
    --version $GITHUB_SHA \
    --environment $npm_config_env
fi
