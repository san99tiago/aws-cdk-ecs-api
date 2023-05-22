#!/bin/bash

################################################################################
# ------------------------------------------------------------------------------
# |CDK COMMANDS (FOR EXPLAINING ITS USAGE)
# ------------------------------------------------------------------------------
################################################################################


################################################################################
# PART 1: Configure NodeJs and CDK libraries
################################################################################

# Install NodeJs
# -->  https://nodejs.org/en/download/

# Verify that NodeJs/npm is installed correctly
node --version
npm --version

# Install AWS-CDK (on NodeJs)
sudo npm install -g aws-cdk

# Verify correct install of AWS-CDK
npm list --global | grep aws-cdk


################################################################################
# PART 2: Initial Project Setup (Only run these at the beginning)
################################################################################

# Configure AWS credentials (follow steps, or use your preferred method)
aws configure

# Bootstrap CDK (provision initial resources to work with CDK.. S3, roles, etc)
#! Change "ACCOUNT-NUMBER-1" and "REGION-1" to your needed values
cdk bootstrap aws://ACCOUNT-NUMBER-1/REGION-1

# Create the CDK project's folder
mkdir cdk
cd cdk || echo "Make sure that the folder exists"

# Initialize project
cdk init --language python

# Install Node/TypeScript modules
npm install .


################################################################################
# PART 3: Main CDK commands (most used)
################################################################################

# Move to "cdk" folder (where the CDK config and deployment files are located)
cd ./cdk || exit
cdk deploy

# CDK commands
cdk synthesize
cdk diff
cdk deploy
cdk destroy


################################################################################
# PART 4: Other CDK usefull commands
################################################################################

# Help
cdk --help
cdk command --help
