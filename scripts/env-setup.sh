#!/bin/bash

# Load environment variables
set -a # all variables that are subsequently defined are automatically exported to the environment of subsequent commands
source .env
set +a # turns off allexport

# Set Git-related environment variables
export GITHUB_SHA=$(git rev-parse --short HEAD)
export GITHUB_BRANCH=$(git rev-parse --abbrev-ref HEAD)