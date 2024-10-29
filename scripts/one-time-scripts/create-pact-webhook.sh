#!/bin/bash

# Pre-setup:
# Ensure that you have pact-broker working; pact-broker version
# Get it at https://github.com/pact-foundation/pact-ruby-standalone/releases, per your OS
# You may have to set the path with
# export PATH=$PATH:$(pwd)/pact/bin
# or 
# set -x PATH $PATH (pwd)/pact/bin
# 
# Ensure that your target provider GitHub repository has a .yml workflow file in .github/workflows/ 
# configured to respond to repository_dispatch events with an event type like "contract_requiring_verification_published".
# Example: https://github.com/muratkeremozcan/pact-js-example-provider/blob/main/.github/workflows/webhook.yml

# Set the Pact Broker and GitHub tokens and URLs as environment variables
PACT_BROKER_BASE_URL="Your_PactFlow_Org_URL"
PACT_BROKER_TOKEN="Your_Pact_Token"
GITHUB_AUTH_TOKEN="Your_GitHub_Personal_Access_Token"

# Set customizable parameters
DESCRIPTION="Your_webhook_description"                # Description for the webhook
CONSUMER_NAME="Pact_consumer_name"                    # Consumer name in Pact
PROVIDER_NAME="Pact_provider_name"                    # Provider name in Pact
GITHUB_REPO_OWNER="Your_user_name"                    # GitHub username or org
GITHUB_REPO_NAME="Your_repo_name"                     # GitHub repository name

# GitHub dispatch endpoint for the repository and workflow file
REPO_DISPATCHES="https://api.github.com/repos/$GITHUB_REPO_OWNER/$GITHUB_REPO_NAME/dispatches"

# Log important parameters for verification
echo "Pact Broker Base URL: $PACT_BROKER_BASE_URL \"
echo "GitHub Dispatch Endpoint: $REPO_DISPATCHES \"
echo "Consumer: $CONSUMER_NAME \"
echo "Provider: $PROVIDER_NAME \"
echo "Description: $DESCRIPTION"

# Step 1: Verify the Pact Broker URL
echo "Checking Pact Broker accessibility..."
PACT_BROKER_STATUS=$(curl -o /dev/null -s -w "%{http_code}" \
  -H "Authorization: Bearer $PACT_BROKER_TOKEN" \
  "$PACT_BROKER_BASE_URL")

if [ "$PACT_BROKER_STATUS" -ne 200 ]; then
  echo "Error: Pact Broker URL is not accessible. Status code: $PACT_BROKER_STATUS"
  echo "Please check the PACT_BROKER_BASE_URL & PACT_BROKER_TOKEN."
  exit 1
else
  echo "Pact Broker URL is accessible."
fi

# Step 2: Check if the GitHub dispatch endpoint is accessible
echo "Checking GitHub dispatch endpoint..."
RESPONSE_STATUS=$(curl -o /dev/null -s -w "%{http_code}" -X POST "$REPO_DISPATCHES" \
    -H "Authorization: Bearer $GITHUB_AUTH_TOKEN" \
    -H "Accept: application/vnd.github.everest-preview+json" \
    -d '{"event_type": "contract_requiring_verification_published"}')

if [ "$RESPONSE_STATUS" -ne 204 ]; then
  echo "Error: Unable to access GitHub dispatch endpoint. Status code: $RESPONSE_STATUS"
  echo "Please check your GitHub token and webhook related yml. You may have to create a yml with repository_dispatch of type contract_requiring_verification_published"
  exit 1
else
  echo "GitHub dispatch endpoint is accessible."
fi

# Step 3: Run the pact-broker command to create the webhook
echo "Creating Pact webhook..."
pact-broker create-webhook "$REPO_DISPATCHES" \
    --request=POST \
    --header 'Content-Type: application/json' \
    --header 'Accept: application/vnd.github.everest-preview+json' \
    --header "Authorization: Bearer $GITHUB_AUTH_TOKEN" \
    --data '{
        "event_type": "contract_requiring_verification_published",
        "client_payload": {
            "pact_url": "${pactbroker.pactUrl}",
            "sha": "${pactbroker.providerVersionNumber}",
            "branch": "${pactbroker.providerVersionBranch}",
            "message": "Verify changed pact for ${pactbroker.consumerName} version ${pactbroker.consumerVersionNumber} branch ${pactbroker.consumerVersionBranch} by ${pactbroker.providerVersionNumber} (${pactbroker.providerVersionDescriptions})"
        }
    }' \
    --broker-base-url="$PACT_BROKER_BASE_URL" \
    --broker-token="$PACT_BROKER_TOKEN" \
    --consumer="$CONSUMER_NAME" \
    --provider="$PROVIDER_NAME" \
    --description="$DESCRIPTION" \
    --contract-requiring-verification-published
