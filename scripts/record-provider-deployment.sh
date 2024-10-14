#!/bin/bash

# Load environment variables
. ./scripts/env-setup.sh

# Record provider deployment (MoviesAPI) only for the main branch
if [ "$GITHUB_BRANCH" = "main" ]; then
  pact-broker record-deployment \
      --pacticipant MoviesAPI \
			--version $GITHUB_SHA \
      --pacticipant MoviesAPI-event-producer \
      --version $GITHUB_SHA \
      --environment $npm_config_env;
fi