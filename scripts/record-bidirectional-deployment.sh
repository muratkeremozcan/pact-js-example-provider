#!/bin/bash

# Load environment variables
. ./scripts/env-setup.sh

# Record deployment for MoviesAPI-bi-directional if the branch is main
if [ "$GITHUB_BRANCH" = "main" ]; then
    pact-broker record-deployment \
        --pacticipant MoviesAPI-bi-directional \
        --version $GITHUB_SHA \
        --environment $npm_config_env
fi
