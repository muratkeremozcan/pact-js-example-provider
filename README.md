# PactJS Contract Testing Example

![Pact Status](https://ozcan.pactflow.io/pacts/provider/MoviesAPI/consumer/WebConsumer/latest/badge.svg)

![Can I Deploy?](https://ozcan.pactflow.io/pacticipants/MoviesAPI/branches/main/latest-version/can-i-deploy/to-environment/dev/badge.svg)

An example test framework using Pact-js to validate contract testing between consumer and provider. The application that we are testing is a simple movies API that returns a list of movies.

The biggest selling point of Consumer Driven Contract Testing (CDCT) in simple terms is the entities do not have to be in a common deployment; the contract / pact / json file instead binds them together. Which means we can work on the consumer in isolation, we can work on the provider in isolation, and we can test their integration without having to have them both running on the same machine or the same deployment.

Provider service: https://github.com/muratkeremozcan/pact-js-example-provider

Consumer service: https://github.com/muratkeremozcan/pact-js-example-consumer

React consumer app for bi-directional contract testing: https://github.com/muratkeremozcan/pact-js-example-react-consumer

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/lxvhm3whvq36023haozh.png)

- [PactJS Contract Testing Example](#pactjs-contract-testing-example)
  - [Setup](#setup)
    - [Webhook setup](#webhook-setup)
    - [Consumer flow](#consumer-flow)
    - [Provider flow](#provider-flow)
    - [Other scripts on both sides](#other-scripts-on-both-sides)
      - [Consumer specific scripts](#consumer-specific-scripts)
      - [Provider specific scripts](#provider-specific-scripts)
      - [Provider selective testing](#provider-selective-testing)
      - [Handling Breaking Changes](#handling-breaking-changes)
      - [Breaking change - consumer flow](#breaking-change---consumer-flow)
      - [Breaking change - provider flow](#breaking-change---provider-flow)
  - [Consumer Tests](#consumer-tests)
  - [Provider Tests](#provider-tests)
    - [Execution](#execution)
  - [Message queue consumer tests in short](#message-queue-consumer-tests-in-short)
  - [Message queue provider tests in short](#message-queue-provider-tests-in-short)
    - [Execution (Same as traditional CDCT)](#execution-same-as-traditional-cdct)
  - [Can I Deploy?](#can-i-deploy)
  - [Record Deployments](#record-deployments)
  - [Webhooks](#webhooks)
  - [Nuances of the env vars \& scripts](#nuances-of-the-env-vars--scripts)
    - [Why `GITHUB_SHA` and `GITHUB_BRANCH`?](#why-github_sha-and-github_branch)
    - [What is the Pact Matrix?](#what-is-the-pact-matrix)
  - [Bi-directional contract testing](#bi-directional-contract-testing)
    - [Consumer flow for Pact Bi-directional contract testing](#consumer-flow-for-pact-bi-directional-contract-testing)
    - [Provider flow for Pact Bi-directional contract testing](#provider-flow-for-pact-bi-directional-contract-testing)
    - [How does it work in the CI](#how-does-it-work-in-the-ci)
  - [OpenAPI Documentation and Schema Validation](#openapi-documentation-and-schema-validation)
  - [Database Management](#database-management)

## Setup

```bash
npm i
```

We are using [Pactflow](https://pactflow.io/) as our broker. To use Pactflow, register for their free developer plan.

Use the sample `.env.example` file to create a `.env` file of your own. These values will also have to exist in your CI secrets.

```bash
# create a free pact broker at
# https://pactflow.io/try-for-free/
PACT_BROKER_TOKEN=***********
PACT_BROKER_BASE_URL=https://yourownorg.pactflow.io
# need this for Prisma
DATABASE_URL="file:./dev.db"
# the port the local server will run on. If you want to change it, just modify the .env file, and the yml files
PORT=3001
```

### Consumer flow

The numbers indicate the order the commands should occur when running them locally.

> For CI, check out the Webhooks section below.

```bash
npm run test:consumer # (1)
npm run publish:pact  # (2)
npm run can:i:deploy:consumer # (4)
# only on main
npm run record:consumer:deployment --env=dev # (5) change the env param as needed
```

### Provider flow

```bash
# start the provider service and run the tests
# npm run start #
# npm run test:provider #
npm run test:provider-ci # (3) # starts the provider service and runs the tests
npm run can:i:deploy:provider # (5)
# only on main
npm run record:provider:deployment --env=dev # (5) change the env param as needed
```

### Other scripts on both sides

```bash
npm run lint
npm run typecheck
npm run fix:format
npm run validate # all the above in parallel

npm run test # unit tests
npm run test:watch # watch mode

npm run cy:open-local # open mode
npm run cy:run-local  # run mode
npm run cy:run-local-fast  # no video or screen shots
```

#### Consumer specific scripts

To exercise the e2e of the consumer side, we need a running backend.
If using the real backend, we can set the PORT at `.env` to the backend port (3001).
If using a back backend, we use `Mockoon` which runs on PORT 3000.

```bash
npm run mock:server # starts the mock backend/provider server
npm start # only used to demo kafka events on the consumer side
```

#### Provider specific scripts

Using Kafka and Docker is optional. The Kafka version of the CRUD e2e test checks whether Kafka events are being written to a file, in addition to the standard CRUD operations. This test will only run if Docker is started and the Kafka UI is available. Therefore, make sure to start Docker (e.g., Docker Desktop) before executing the `kafka:start` script and the e2e test `crud-movie-event.cy.ts`.

```bash
npm run kafka:start # start Docker first, and then run this
npm run kafka:stop # to stop when we are done

# these 2 run as a part of start, and reset the db
# you usually don't have to use them
npm run db:migrate
npm run reset:db

npm run optic:lint # verifies the OpenAPI doc
npm run optic:diff # compares the OpenAPI on the PR to main, to find breaking changes
npm run optic:verify # executes the e2e against the OpenAPI doc to gain API coverage and validate it
npm run optic:update # executes the e2e, and interactively update the OpenAPI doc
npm run optic:verify-ci # the above, but it also starts the server, in case you're not running it on the side

npm run generate:openapi # generates an OpenAPI doc from Zod schemas
npm run publish:pact-openapi # publishes the open api spec to Pact Broker for BDCT
npm run record:provider:bidirectional:deployment --env=dev # records the bi-directional provider deployment
```

### Webhook setup

For the webhook to test successfully: 

* **You must have executed pact tests at the consumer and provider**; the Pact Broker has to know about them.

* You must create a yml with `repository_dispatch ` event at your provider (you can use this file https://github.com/muratkeremozcan/provider/blob/main/.github/workflows/webhook.yml at your provider, edit the test executions portion as you see fit).

Flow:

1. [Create a GitHub personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) with the public_repo access granted.

   You can test your GitHub token with the script `scripts/one-time-scripts/create-github-issue-test.sh`.
   Update the repo variables, give the file execution permissions and execute it. Do not check in the file with secrets in display.

   ```bash
   # give it execution permissions
   chmod +x ./scripts/one-time-scripts/create-github-issue-test.sh
   # execute it
   ./scripts/one-time-scripts/create-github-issue-test.sh
   ```

   ```bash
   #!/bin/bash
   
   # this file is a test for your GitHub Personal Access token
   # if you can create an issue, then Pact webhook will work
   
   # Set your GitHub credentials and repository details
   GITHUB_REPO_OWNER="Your_GITHUB_REPO_OWNER"                      # GitHub username or org
   GITHUB_REPO_NAME="Your_repo_name"                               # GitHub repository name
   GITHUB_AUTH_TOKEN="Your_GitHub_Personal_Access_Token"           # GitHub Personal Access Token with repo permissions
   
   # Issue details
   ISSUE_TITLE="Test issue"                                    # Title of the issue to be created
   ISSUE_BODY="This is a test issue created via API."          # Body of the issue
   
   # Step 1: Verify the GitHub Token
   echo "Verifying GitHub token..."
   TOKEN_VERIFICATION_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $GITHUB_AUTH_TOKEN" https://api.github.com/users/$GITHUB_REPO_OWNER)
   
   if [ "$TOKEN_VERIFICATION_RESPONSE" -ne 200 ]; then
     echo "Error: Bad credentials. Please check your GitHub token and ensure it has the required permissions."
     exit 1
   else
     echo "GitHub token verified successfully."
   fi
   
   # GitHub API endpoint for creating an issue
   ISSUE_URL="https://api.github.com/repos/$GITHUB_REPO_OWNER/$GITHUB_REPO_NAME/issues"
   
   # Step 2: Run the curl command to create the issue
   echo "Creating a new GitHub issue..."
   curl -X POST "$ISSUE_URL" \
       -H "Accept: application/vnd.github.v3+json" \
       -H "Authorization: Bearer $GITHUB_AUTH_TOKEN" \
       -d "{\"title\": \"$ISSUE_TITLE\", \"body\": \"$ISSUE_BODY\"}"
   ```

2. Add the GitHub token to PactFlow (Settings>Secrets>Add Secret, name it `githubToken`).

3. Create the Pact web hook (Settings>Webhooks>Add Webhook).

   > There are no values under Authentication section.

   Headers:

   ```bash
   Content-Type: application/json
   Accept: application/vnd.github.everest-preview+json
   Authorization: Bearer ${user.githubToken}
   ```

   Body:

   ```bash
   {
     "event_type": "contract_requiring_verification_published",
     "client_payload": {
       "pact_url": "${pactbroker.pactUrl}",
       "sha": "${pactbroker.providerVersionNumber}",
       "branch": "${pactbroker.providerVersionBranch}",
       "message": "Verify changed pact for ${pactbroker.consumerName} version ${pactbroker.consumerVersionNumber} branch ${pactbroker.consumerVersionBranch} by ${pactbroker.providerVersionNumber} (${pactbroker.providerVersionDescriptions})"
     }
   }
   ```

   

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/be9ywm042qtxj9i5h6nu.png)

Alternatively, use the CLI to add the webhook. Prior to running the scripts:

* Make sure to [install pact broker](https://github.com/pact-foundation/pact-ruby-standalone/releases); `pact-broker version` command should output a meaningful result.

* Set the values of the variables in the beginning of the script. **Careful not to check in the file with secrets in display**.

```bash
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

```

#### Provider selective testing

By default, Pact provider tests run against all consumers and their respective contracts, which can make it difficult to debug specific issues. To narrow down the scope and run selective tests, you can filter by specific consumer or use Pact selectors to focus on certain interactions or states.

Refer to the [Pact JS Troubleshooting Guide](https://docs.pact.io/implementation_guides/javascript/docs/troubleshooting) for more details.

You can use the following environment variables to select specific interactions or states:

- `PACT_DESCRIPTION`: Selects all tests containing this string in their description (from the test output or the pact file).
- `PACT_PROVIDER_STATE`: Selects all tests containing this string in one of their provider states.
- `PACT_PROVIDER_NO_STATE`: Set to `TRUE` to select all tests without provider states.

```bash
PACT_DESCRIPTION="a request to get all movies" npm run test:provider

PACT_DESCRIPTION="a request to get all movies" PACT_PROVIDER_STATE="An existing movie exists" npm run test:provider

PACT_PROVIDER_STATE="Has a movie with a specific ID" npm run test:provider

PACT_DESCRIPTION="a request to a specific movie" PACT_PROVIDER_STATE="Has a movie with a specific ID" npm run test:provider

PACT_DESCRIPTION="a request to delete a movie that exists" PACT_PROVIDER_STATE="Has a movie with a specific ID" npm run test:provider

PACT_PROVIDER_NO_STATE=true npm run test:provider
```

To run tests from a certain consumer:

```bash
PACT_CONSUMER="WebConsumer" npm run test:provider
```

#### Handling Breaking Changes

When verifying consumer tests, we use the following default settings:

- `matchingBranch`: Tests against the consumer branch that matches the provider's branch.
- `mainBranch`: Tests against the consumer's main branch.
- `deployedOrReleased`: Tests against the consumer's currently deployed or released versions.

For **breaking changes** introduced on the provider side, you may want to verify only against matching branches, avoiding failures caused by incompatible versions in `mainBranch` or `deployedOrReleased`.

To handle this scenario, use the `PACT_BREAKING_CHANGE` environment variable:

```bash
PACT_BREAKING_CHANGE=true npm run test:provider
```

In CI, you can enable this behavior by including a checkbox in the PR description. If the box is unchecked or not included, the `PACT_BREAKING_CHANGE` variable is set to `false`.

```readme
- [x] Pact breaking change
```

#### Breaking change - consumer flow

```bash
# (2) UPDATE the consumer test
npm run test:consumer # (2) execute it
npm run publish:pact  # (3) publish the pact
npm run can:i:deploy:consumer # (6)
# only on main
npm run record:consumer:deployment --env=dev # (7)
```

#### Breaking change - provider flow

```bash
# (1) create a branch with the breaking (source code) change
PACT_BREAKING_CHANGE=true npm run test:provider-ci # (4) start the provider service and run the tests
# note: can:i:deploy:provider is skipped because we are introducing the breaking change
# (5) merge to main
```

## Consumer Tests

Here is how it works:

1. Write the consumer test.

2. Execute the and generate a contract / pact / json file.

   The contract specifies how the provider should respond upon receiving requests from the consumer.

3. Once the contract is created, from then on the Pact `mockProvider` takes over as if we are locally serving the provider API and executing the tests against that.
   That means, there is no need to serve the client api or the provider api at the moment, the consumer tests and `mockProvider` cover that interaction.

4. The consumer test can only fail at the `executeTest` portion, if / when the assertions do not match the specifications. Any changes to the `provider` section makes updates to the contract.

Here's how a test generally looks:

```js
// consumer test

it('...', () => {
  await pact
    // simulate/specify how the provider should respond
    .addInteraction(...)
    .given(some state name) // optional
    .uponReceiving(<the name of the test>)
    .withRequest(http verb, path)
    .willRespondWith({ this is the meat and bones of the response })

    .executeTest(async(mockProvider) => {
    // call the source code &
    // make assertions against the mockProvider/contract
  })
})
```

Run the consumer tests:

```bash
npm run test:consumer
```

The pact gets recorded, the consumer tests (`executeTest`) are verified against the contract.

Now, for the provider to know about it all, we need to publish the contract

Publish the contract to your Pact Broker:

```bash
npm run publish:pact
```

## Provider Tests

The main goal is to verify that the provider API can fulfill the contract expectations defined by the consumer(s). This ensures that any changes made to the provider won't break existing consumer integrations.

Here is how it works

1. The consumer already generated the contract and published it.
2. The provider has one test per consumer to ensure all is satisfactory. Most of the file is about setting up the options.
3. We ensure that the provider api is running locally.
4. The consumer tests execute against the provider api, as if they are a regular API client running locally.

Here is how the test generally looks:

```js
const options = {..} // most the work is here (ex: provider states)
const verifier = new Verifier(options)

it('should validate the expectations..', () => {
  return verifier.verifyProvider().then((output) => {
    console.log('Pact Verification Complete!')
    console.log('Result:', output)
  })
})
```

#### Execution

Run the Movies API:

```bash
npm run start
```

> The provider API has to be running locally for the provider tests to be executed.

Run the provider test:

```bash
npm run test:provider
```

Two in one:

```bash
npm run test:provider-ci
```

**Provider States**: We can simulate certain states of the api (like an empty or non-empty db) in order to cover different scenarios

- Provider states help maintain the correct data setup before verification.
- State handlers must match the provider states defined in consumer tests.

## Message queue consumer tests in short

1. Write the consumer test.

   Message q consumer test: **simulates receiving a message from the queue**.

   Traditional consumer test: **simulates receiving a response from the provider**.

2. Execute the and generate a contract / pact / json file. (same)

   The message queue contract **specifies the expected structure of the message from the producer.**

   Traditional consumer test contract **specifies the expected structure of the response from the provider**.

3. Once the contract is created, Pact `mockProducer` takes over as if we are locally pushing messages to the queue (`expectsToReceive`) and verifying the message agains our src code event-message-consumer-handler.

   This is similar to traditional consumer test where the `mockProvider` takes over as if we are locally serving the provider API and executing the tests against that.

4. The test can fail at the `verify` portion, if / when the simulated message does not match our src code event-message-consumer.

Here is a contract test vs message queue test side by side:

```typescript
// message queue consumer test

it('...', () => {
  await messagePact
    // simulate/specify the expected message
    .expectsToReceive('some text for event name')
    .withContent({ this is the meat and bones of the event })
    .withMetaData({ contentType: 'application/json' })

    // feed the message into the event consumer
    .verify(asynchronousBodyHandler(yourEventConsumerHandler))
  })
})
```

```typescript
// consumer test

it('...', () => {
  await pact
    // simulate/specify how the provider should respond
    .addInteraction(...)
    .given(some state name) // optional
    .uponReceiving(<the name of the test>)
    .withRequest(http verb, path)
    .willRespondWith({ this is the meat and bones of the response })

    .executeTest(async(mockProvider) => {
    // call the source code &
    // make assertions against the mockProvider/contract
  })
})
```

The flow is the same as a traditional consumer test, in fact if the repo has both, both tests are executed

```bash
npm run test:consumer
npm run publish:pact
```

## Message queue provider tests in short

These tests verify that **the messages the provider produces match the structure the consumer expects**.

In contrast, in traditional CDCT, the tests verify that **the responses of the provider API match the structure the consumer expects**.

1. The message consumer already generated the contract and published it. (Same thing as the traditional CDCT)

2. The provider has one test per consumer to ensure all is satisfactory. Most of the file is about setting up the options. (Again, same)

3. We ensure that the provider api is running locally. (Again, same)

4. **The message queue consumer tests execute against the provider/message-producer**, as if they are a regular message-consumer running locally.

   In contrast, in traditional CDCT, **the consumer tests execute against the provider api**, as if they are a regular API client running locally.

### Execution (Same as traditional CDCT)

Run the server/service.

```bash
npm run start
```

> The provider/producer server/service has to be running locally for the provider message queue tests to be executed.

Run the provider/producer message queue test

```bash
npm run test:provider
```

Two in one:

```bash
npm run test:provider:ci
```

## Can I Deploy?

Before deploying to an environment, we verify if the consumer and provider versions are compatible using the `can-i-deploy` tool. This step ensures that any changes made to the consumer or provider do not break existing integrations across environments.

In the current setup, the provider is tested against the consumer's main branch and currently deployed versions (`dev`).

Verify the provider:

```bash
npm run can:i:deploy:provider
```

Verify the consumer:

```bash
npm run can:i:deploy:consumer
```

## Record Deployments

This is akin to releasing; used to record the deployment in the Pact Broker to show the deployed version in an environment. Usually this is `main` being deployed on `dev` environment.

You can also run them locally but they will only execute on `main` branch. These scripts are designed to only record deployments when on the `main` branch, ensuring that only final production-ready versions are tracked.

Record the provider deployment:

```bash
npm run record:provider:deployment --env=dev # change the env param as needed
```

Record the consumer deployment:

```bash
npm run record:consumer:deployment --env=dev # change the env param as needed
```

## Webhooks

Recall the consumer and provider flow.

The key is that, when there are multiple repos, the provider has to run `test:provider-ci` `(#3)` after the consumer runs `publish:pact` `(#2)` but before the consumer can run `can:i:deploy:consumer` `(#4)` . The trigger to run `test:provider-ci` `(#3)` has to happen automatically, webhooks handle this.

```bash
# Consumer
npm run test:consumer # (1)
npm run publish:pact  # (2)
npm run can:i:deploy:consumer # (4)
# only on main
npm run record:consumer:deployment --env=dev # (5) change the env param as needed

# Provider
npm run test:provider-ci # (3) triggered by webhooks
npm run can:i:deploy:provider # (4)
# only on main
npm run record:provider:deployment --env=dev # (5) change the env param as needed
```

## Nuances of the env vars & scripts

To streamline our scripts, we've centralized the setup of environment variables in a script:

```bash
./scripts/env-setup.sh
```

This script initializes critical environment variables like `GITHUB_SHA` and `GITHUB_BRANCH` and values at the `.env` file `PACT_BROKER_TOKEN` and `PACT_BROKER_BASE_URL`, which are used across multiple scripts to ensure consistency.

Using `GITHUB_SHA` and `GITHUB_BRANCH` in your scripts is essential for ensuring traceability and consistency across different environments and CI/CD workflows. Here's why:

#### Why `GITHUB_SHA` and `GITHUB_BRANCH`?

- **`GITHUB_SHA`**: This variable represents the unique commit ID (SHA) in Git. By using the commit ID as the version identifier when publishing the contract or running tests, you can precisely trace which version of your code generated a specific contract. This traceability is crucial in understanding which code changes correspond to which contract versions, allowing teams to pinpoint when and where an issue was introduced.

- **`GITHUB_BRANCH`**: Including the branch name ensures that contracts and deployments are correctly associated with their respective branches, supporting scenarios where different branches represent different environments or features under development. It helps prevent conflicts or mismatches in contracts when multiple teams or features are being developed simultaneously.

  TL,DR; best practice, do it this way.

#### What is the Pact Matrix?

The Pact Matrix is a feature within Pactflow (or other Pact brokers) that visualizes the relationships between consumer and provider versions and their verification status across different environments. The matrix shows:

- Which versions of consumers are compatible with which versions of providers.
- The verification results of these interactions across various environments (e.g., dev, stage, prod).

By using `GITHUB_SHA` and `GITHUB_BRANCH` in your CI/CD workflows, you ensure that the matrix accurately reflects the state of your contracts and their verifications. This makes it easier to determine if a particular consumer or provider version is safe to deploy in a specific environment, ultimately enabling seamless integration and deployment processes.

Example matrix:

| **Consumer Version (SHA)** | **Provider Version (SHA)** | **Branch**  | **Environment** | **Verification Status** | **Comments**                                                                                             |
| -------------------------- | -------------------------- | ----------- | --------------- | ----------------------- | -------------------------------------------------------------------------------------------------------- |
| `abc123`                   | `xyz789`                   | `main`      | `production`    | Passed                  | The consumer and provider are both verified and deployed in production.                                  |
| `def456`                   | `xyz789`                   | `main`      | `staging`       | Passed                  | The same provider version is compatible with a newer consumer version in staging.                        |
| `ghi789`                   | `xyz789`                   | `feature-x` | `development`   | Failed                  | The consumer from a feature branch failed verification with the provider in the development environment. |
| `jkl012`                   | `uvw345`                   | `main`      | `production`    | Pending                 | A new provider version is pending verification against the consumer in production.                       |

## Bi-directional contract testing

In CDCT, the consumer tests are executed on the provider side, which mandates that the provider server can be served locally. This might be a blocker for CDCT.
It might also happen that we want to contract-test against a provider outside of the org.

BDCT offers an easier alternative to CDCT. All you need is the OpenAPI spec of the provider, and the consumer side stays the same.

Here is how it goes:

1. **Generate the OpeAPI spec at the provider**

   Automate this step using tools like `zod-to-openapi`, `swagger-jsdoc`, [generating OpenAPI documentation directly from TypeScript types, or generating the OpenAPI spec from e2e tests (using Optic)](https://dev.to/muratkeremozcan/automating-api-documentation-a-journey-from-typescript-to-openapi-and-schema-governence-with-optic-ge4). Manual spec writing is the last resort.

2. **Ensure that the spec matches the real API**

   `cypress-ajv-schema-validator`: if you already have cy e2e and you want to easily chain on to the existing api calls.

   Optic: lint the schema and/or run the e2e suite against the OpenAPI spec through the Optic proxy.

   Dredd: executes its own tests (magic!) against your openapi spec (needs your local server, has hooks for things like auth.)

3. **Publish the OpenAPI spec to the pact broker at the provider**.

   ```bash
      npm run publish:pact-openapi
   ```

4. **Record the provider bi-directional deployment at the provider**.

   We still have to record the provider bi-directional, similar to how we do it in CDCT.
   Otherwise the consumers will have nothing to compare against.

   ```bash
   npm run record:provider:bidirectional:deployment --env=dev
   ```

5. **Execute the consumer contract tests at the consumer**

   Execution on the Consumer side works exactly the same as classic CDCT.

   ```bash
    npm run test:consumer
    npm run publish:pact
    npm run can:i:deploy:consumer
    # only on main
    npm run record:consumer:deployment --env=dev
   ```

As you can notice, there is nothing about running the consumer tests on the provider side ( `test:provider`), can-i-deploy checks (`can:i:deploy:provider`),. All you do is get the OpenAPI spec right, publish it to Pact Broker, and record the deployment

We have a sample consumer repo for BDCT [pact-js-example-react-consumer](https://github.com/muratkeremozcan/pact-js-example-react-consumer).

The [api calls](https://github.com/muratkeremozcan/pact-js-example-react-consumer/blob/main/src/consumer.ts) are the same as the plain, non-UI app used int CDCT.

We cannot have CDCT and BDCT in the same contract relationship. Although, we can have the provider have consumer driven contracts with some consumers and provider driven contracts with others

```bash
Consumer        -> CDCT  -> Provider

Consumer-React  <- BDCT  <- Provider
```

#### Consumer flow for Pact Bi-directional contract testing

```bash
npm run test:consumer # (4)
npm run publish:pact # (5)
npm run can:i:deploy:consumer #(6)
# only on main
npm run record:consumer:deployment --env=dev # (7) change the env param as needed
```

#### Provider flow for Pact Bi-directional contract testing

```bash
npm run generate:openapi # (1) generates an OpenAPI doc from Zod schemas
npm run publish:pact-openapi # (2) on main, publish the open api spec to Pact Broker for BDCT
npm run record:provider:bidirectional:deployment --env=dev # (3) on main record the bi-directional provider deployment
```

### How does it work in the CI

The e2e tests already do the schema testing. A section was appended to the end of `e2e-test.yml` to generate a text file about the status of the e2e run. Pact likes to have some file/evidence that the OpenAPI spec was tested, this satisfies that.

```yml
# e2e-test.yml

# ... all the e2e

# We do schema testing within the api e2e
# We publish the OpenAPI spec on main, once after the PR is merged
# Pact likes to have some file/evidence that the OpenAPI spec was tested
# This section handles that need

- name: Generate Verification Result for Success
  if: steps.cypress-tests.conclusion == 'success'
  run: echo "All Cypress tests passed." > cypress/verification-result.txt

- name: Generate Verification Result for Failure
  if: steps.cypress-tests.conclusion != 'success'
  run: echo "Not all Cypress tests passed." > cypress/verification-result.txt

- name: Commit and push verification result
  uses: EndBug/add-and-commit@v9
  with:
    author_name: 'GitHub Actions'
    author_email: 'actions@github.com'
    message: 'Update verification results'
    add: 'cypress/verification-result.txt'
    push: true
```

Using the same commit-and-push GitHub action, we have another `contract-commit-openapi.yml`, which ensures that the latest openapi spec is committed to the PR, if the changed. That way we do not have to locally generate the OpenAPI spec.

When the PR runs, `e2e-test.yml` executes and tests the schema. `contract-commit-openapi.yml` handles the OpenAPI spec.

The merge to main happens on a passing PR.

Finally, on main. we have `contract-publish-openapi.yml` , which publishes the OpenAPI spec to Pact broker with `npm run publish:pact-openapi` and records the bi-directional provider deployment with `npm run record:provider:bidirectional:deployment --env=dev`.

## OpenAPI Documentation and Schema Validation

This project uses Zod and zod-to-openapi to generate OpenAPI documentation. The process involves the following steps:

1. **Schema Definition**:

   - Define schemas using Zod and zod-to-openapi.
   - Link schemas with TypeScript types using `z.infer`.
   - Utilize zod's `safeParse` for runtime type checking.

> `src/@types/schema.ts` contains the schema definitions.

2. **Schema Registration**:

   - Register all schemas with the OpenAPI Registry `OpenAPIRegistry` from `@asteasolutions/zod-to-openapi`.

> `src/api-docs/openapi-generator.ts` contains the schema registration.

3. **OpenAPI Document Generation**:

   - Use `OpenApiGeneratorV31` from `@asteasolutions/zod-to-openapi` to generate the full OpenAPI document.
   - This document can be serialized to JSON or YAML.
   - The script `generate:openapi` creates `openapi.json` and `openapi.yaml` files in the `api-docs` directory.

> `src/api-docs/openapi-writer.ts` contains the OpenAPI document generation.

4. **Schema Governance with Optic**:

   - We use Optic for schema governance.
   - The `optic:diff` command:
     - Lints and verifies the OpenAPI doc for validity.
     - Compares the OpenAPI spec on the main branch with the one in the PR.
     - Detects breaking changes, which we should communicate to API consumers.
     - The only way through a breaking change is incrementing the major version of the OpenAPI spec.

   ```bash
      npm run optic:diff # breaking change detected

     # update the OpenAPI doc version at src/api-docs/openapi-generator.ts

     npm run generate:openapi # rewrite/update the OpenAPI document

     npm run optic:diff # rerun Optic to ensure the breaking change is okay to be merged

     # communicate with the API consumers about the breaking change

     # note: generate:openapi & optic:diff are all done in the CI pipeline
     # .github/workflows/contract-test-commit-openapi.yml
   ```

5. **Runtime Schema Validation**:
   - We use the `cypress-ajv-schema-validator` plugin in our API E2E tests.
   - This ensures that we test our schema during E2E testing.
   - It helps identify potential breaking changes that might pass our tests but could fail for API consumers.
   - The result of these tests are used in Bi-directional contract testing, to ensure that the OpenAPI spec the bi-directional contract consumers test against is always up to spec. If the tests pass, they get merged in main, published to the Pact Broker, and then recorded.

This comprehensive approach ensures that our API documentation is always in sync with our schema definitions, provides flexibility in how we serve and distribute the documentation, and maintains strict governance over schema changes. It also helps us proactively identify and communicate breaking changes to our API consumers.

Mind that, if we are only doing bi-directional contract testing, the only information that should alert us and in turn our consumers about a breaking change is the `optic:diff` and the OpenAPI spec update. Bi-directional contract testing does not block Provider PRs, it only blocks Consumer PRs. As soon as our breaking change from the Provider is merged to main, all consumers are blocked until they accommodate the breaking changes.

## Database Management

This project uses Prisma for database operations. Two main scripts are available:

`npm run db:migrate`

Resets the database using Prisma migrations. Use this to apply all migrations and reset to a clean state.

`npm run db:sync`

Synchronizes the database schema with the current Prisma schema. Use this for quick updates during development.

**Note:** Both scripts will reset your database. Use with caution in production environments.

To start the application with a fresh database, after making changes to `schema.prisma`:

```bash
npm run db:migrate
npm run db:sync
npm run reset:db
```
