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