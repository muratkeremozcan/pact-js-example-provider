#!/bin/bash

# Load environment variables
. ./scripts/env-setup.sh

# Check if provider (MoviesAPI) can be deployed
pact-broker can-i-deploy \
    --pacticipant MoviesAPI \
		--version=$GITHUB_SHA \
    --pacticipant MoviesAPI-event-producer \
    --version=$GITHUB_SHA \
    --to-environment dev \
    --broker-base-url=$PACT_BROKER_BASE_URL
