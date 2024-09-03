# PactJS Contract Testing Example

An example test framework using Pact-js to validate contract testing between consumer and provider. The application that we are testing is a simple movies API that returns a list of movies.

The biggest selling point of Consumer Driven Contract Testing (CDCT) in simple terms is the entities do not have to be in a common deployment; the contract / pact / json file instead binds them together. Which means we can work on the consumer in isolation, we can work on the provider in isolation, and we can test their integration without having to have them both running on the same machine or the same deployment.

Consumer repo: https://github.com/muratkeremozcan/pact-js-example-consumer

Provider repo: https://github.com/muratkeremozcan/pact-js-example-provider

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
```

### Webhook setup

1. [Create a GitHub personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) with the public_repo access granted.

   You can test your GitHub token like so (change your repo url):

   ```bash
   curl -X POST https://api.github.com/repos/muratkeremozcan/pact-js-example-provider/issues \
       -H "Accept: application/vnd.github.v3+json" \
       -H "Authorization: Bearer your github token" \
       -d '{"title": "Test issue", "body": "This is a test issue created via API."}'
   ```

2. Add the GitHub token to PactFlow (Settings>Secrets>Add Secret, name it `githubToken`).

3. Create the Pact web hook (Settings>Webhooks>Add Webhook).

   > There are no values under Authentication section.

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/be9ywm042qtxj9i5h6nu.png)

Alternatively, use the CLI to add the webhook.
First [install pact broker](https://github.com/pact-foundation/pact-ruby-standalone/releases), run the below while setting your PACT_BROKER_TOKEN (.env file) and your Github token (Github UI).

```bash
PACT_BROKER_BASE_URL=https://ozcan.pactflow.io \
PACT_BROKER_TOKEN=yourPactFlowToken \

pact-broker create-webhook https://api.github.com/repos/muratkeremozcan/pact-js-example-provider/dispatches \
        --request=POST \
        --header 'Content-Type: application/json' \
        --header 'Accept: application/vnd.github.everest-preview+json' \
        --header 'Authorization: Bearer yourGithubToken' \
        --data '{
            "event_type": "contract_requiring_verification_published",
            "client_payload": {
                "pact_url": "${pactbroker.pactUrl}",
                "sha": "${pactbroker.providerVersionNumber}",
                "branch": "${pactbroker.providerVersionBranch}",
                "message": "Verify changed pact for ${pactbroker.consumerName} version ${pactbroker.consumerVersionNumber} branch ${pactbroker.consumerVersionBranch} by ${pactbroker.providerVersionNumber} (${pactbroker.providerVersionDescriptions})"
            }
        }'  \
        --broker-base-url=$PACT_BROKER_BASE_URL \
        --broker-token=$PACT_BROKER_TOKEN \
        --consumer=WebConsumer \
        --provider=MoviesAPI \
        --description 'Webhook for MoviesAPI provider' \
        --contract-requiring-verification-published
```

### Consumer flow

The numbers indicate the order the commands should occur when running them locally.

> For CI, check out the Webhooks section below.

```bash
npm run test:consumer # (1)
npm run publish:pact  # (2)
npm run can:i:deploy:consumer # (4)
# only on main
npm run record:consumer:deployment # (5)
```

### Provider flow

```bash
# start the provider service
# npm run start:provider # Todo: use start-server instead of starting the app in the test, then enable this instruction
npm run test:provider # (3)
npm run can:i:deploy:provider # (5)
# only on main
npm run record:provider:deployment # (5)
```

## Consumer Tests

The consumer can be any client that makes API calls. Can be an API service, can be a web app (using Axios for example); it does not make a difference.

The purpose of consumer tests is to define and validate the interactions that the consumer expects from the provider.

Here is how it works:

1. Write the consumer test.

2. Execute the and generate a contract / pact / json file.

   The contract specifies how to provider should respond upon receiving requests from the consumer.

3. Once the contract is created, from then on the Pact `mockProvider` takes over as if we are locally serving the provider API and executing the tests against that.
   That means, there is no need to serve the client api or the provider api at the moment, the consumer tests and `mockProvider` cover that interaction.

4. The consumer test can only fail at the `executeTest` portion, if / when the assertions do not match the specifications. Any changes to the `provider` section makes updates to the contract.

Here's how a test generally looks:

```js
// ...provider setup prior...

it('...', () => {
  provider
    // specifications about how the provider
    // should behave upon receving requests
    // this part is what really configures the contract

  await provider.executeTest(async(mockProvider) => {

    // assertions against the mockProvider/contract
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
npm run start:provider
```

> The provider API has to be running locally for the provider tests to be executed.

Run the provider test:

```bash
npm run test:provider
```

**Provider States**: We can simulate certain states of the api (like an empty or non-empty db) in order to cover different scenarios

- Provider states help maintain the correct data setup before verification.
- State handlers must match the provider states defined in consumer tests.

### Can I Deploy?

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

### Record Deployments

This is akin to releasing; used to record the deployment in the Pact Broker to show the deployed version in an environment. Usually this is `main` being deployed on `dev` environment.

You can also run them locally but they will only execute on `main` branch. These scripts are designed to only record deployments when on the `main` branch, ensuring that only final production-ready versions are tracked.

Record the provider deployment:

```bash
npm run record:provider:deployment
```

Record the consumer deployment:

```bash
npm run record:consumer:deployment
```

## Webhooks

Recall the consumer and provider flow.

The key is that, when there are multiple repos, the provider has to run `test:provider` `(#3)` after the consumer runs `publish:pact` `(#2)` but before the consumer can run `can:i:deploy:consumer` `(#4)` . The trigger to run `test:provider` `(#3)` has to happen automatically, webhooks handle this.

```bash
# Consumer
npm run test:consumer # (1)
npm run publish:pact  # (2)
npm run can:i:deploy:consumer # (4)
# only on main
npm run record:consumer:deployment # (5)

# Provider
npm run test:provider # (3) triggered by webhooks
npm run can:i:deploy:provider # (4)
# only on main
npm run record:consumer:deployment # (5)
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
