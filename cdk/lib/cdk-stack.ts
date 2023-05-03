import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';


export class CdkEcsApi extends Stack {
  constructor(
    scope: Construct,
    id: string,
    deploymentEnvironment: string,
    mainResourcesName: string,
    props?: StackProps
  ) {
    super(scope, id, props);

    // Main variables based on environment variables and fixed values
    const ecsClusterName = deploymentEnvironment == 'prod' ? mainResourcesName : `${deploymentEnvironment}-${mainResourcesName}`;


    // TODO: add CDK ECS cluster code and configs

  }
}
