#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Load environment variables
. ./scripts/env-setup.sh

# Check if MoviesAPI can be deployed
pact-broker can-i-deploy \
    --pacticipant MoviesAPI \
    --version=$GITHUB_SHA \
    --to-environment dev \
    --broker-base-url=$PACT_BROKER_BASE_URL \
    --verbose

# Check if MoviesAPI-event-producer can be deployed
pact-broker can-i-deploy \
    --pacticipant MoviesAPI-event-producer \
    --version=$GITHUB_SHA \
    --to-environment dev \
    --broker-base-url=$PACT_BROKER_BASE_URL \
    --verbose
