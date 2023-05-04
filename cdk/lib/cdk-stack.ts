import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import * as elasticloadbalancing from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';


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
    const hostedZoneName = deploymentEnvironment == 'prod' ? "san99tiago.com" : `${deploymentEnvironment}.san99tiago.com`;  // Example: "availia.io"
    const domainName = `ecs-api.${hostedZoneName}`;
    const applicationPort = 80;

    // Obtain extra IDs/variables from SSM Parameters
    const vpcId = ssm.StringParameter.valueFromLookup(this, `/${mainResourcesName}/${deploymentEnvironment}/vpc-id`);

    // TODO: uncomment if ALB already exists, otherwise, is created it bellow
    // const loadBalancerArn = ssm.StringParameter.valueFromLookup(this, `/${mainResourcesName}/${deploymentEnvironment}/alb-arn`);;

    // Obtain resource from existing VPC
    const vpc = ec2.Vpc.fromLookup(this, "VPC", {
      region: 'us-east-1',
      vpcId: vpcId,
    });

    // Obtain account R53 Hosted Zone for specific domain (previously created in account)
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: hostedZoneName
    });

    // Add SSL certificate
    // ! IMPORTANT: this is currently automatic, but if the R53 Hosted Zone is
    // ! ... in another account, this has to be done manually by DNS validation
    const certificate = new acm.DnsValidatedCertificate(this, 'Certificate', {
      domainName: domainName,
      hostedZone: hostedZone,
      subjectAlternativeNames: [`www.${domainName}`],  // To also allow the common 'www' prefix
      region: 'us-east-1',
    });
    certificate.metricDaysToExpiry().createAlarm(this, 'AlarmCertificateExpiration', {
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      evaluationPeriods: 1,
      threshold: 45, // Automatic rotation happens between 60 and 45 days before expiry
    });

    // TODO: uncomment if ALB already exists, otherwise, is created it bellow
    // // Get Application load balancer (ALB) resource (previously created in account)
    // const alb = elasticloadbalancing.ApplicationLoadBalancer.fromLookup(this, 'ALB', {
    //   loadBalancerArn: loadBalancerArn
    // });

    // Create Application load balancer (ALB) resource (previously created in account)
    const alb = new elasticloadbalancing.ApplicationLoadBalancer(this, 'ALB', {
      loadBalancerName: `${mainResourcesName}-${deploymentEnvironment}`,
      vpc: vpc,
      vpcSubnets: { subnets: vpc.publicSubnets },
      internetFacing: true,
    });

    // ALB Security Group to provide a secure connection to the ALB on 443
    const albSG = new ec2.SecurityGroup(this, "SG-ALB", {
      vpc: vpc,
      allowAllOutbound: true,
    });

    albSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      "Allow HTTPS traffic"
    );

    alb.connections.addSecurityGroup(albSG);

    // Create ECS Cluster for service/tasks deployments
    const cluster = new ecs.Cluster(this, "ECS-Cluster", {
      clusterName: ecsClusterName,
      vpc: vpc,
    });

    // Role assumed by the task and its containers
    const taskRole = new iam.Role(this, "ECS-TaskRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      roleName: `${mainResourcesName}-task-role-${deploymentEnvironment}`,
      description: "Role that the task definitions will use to run the code",
    });

    // TODO: Update role based on Containers/ECS needs. Example s3 template
    taskRole.attachInlinePolicy(
      new iam.Policy(this, "ECS-TaskPolicy", {
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["s3:GetObject", "s3:GetObjectAcl"],
            resources: ["*"],
          }),
        ],
      })
    );

    // Task definition for ECS container
    const taskDefinition = new ecs.TaskDefinition(this, "ECS-TaskDefinition", {
      family: `${mainResourcesName}-task`,
      compatibility: ecs.Compatibility.EC2_AND_FARGATE,
      cpu: "256",
      memoryMiB: "512",
      networkMode: ecs.NetworkMode.AWS_VPC,
      taskRole: taskRole,
    });

    // The Docker container for the task definition
    const container = taskDefinition.addContainer("ECS-Container", {
      image: ecs.ContainerImage.fromAsset("../src/"),  // build and upload an image directly from a Dockerfile in your source directory.
      memoryLimitMiB: 512,
      environment: {
        EXAMPLE_KEY: "EXAMPLE_VALUE",
        OWNERS: "SantiagoGarcia_AndresMontano",
        ENVIRONMENT: deploymentEnvironment,
      },
      // Store the logs in cloudwatch
      logging: ecs.LogDriver.awsLogs({ streamPrefix: mainResourcesName }),
    });

    // Docker container port mappings within the container
    container.addPortMappings(
      {
        containerPort: applicationPort
      }
    );

    // Security groups to allow connections from the application load balancer to the containers
    const ecsSG = new ec2.SecurityGroup(this, "SG-ECS", {
      vpc: vpc,
      allowAllOutbound: true,
    });
    ecsSG.connections.allowFrom(
      albSG,
      ec2.Port.allTcp(),
      "ALB to ECS containers"
    );

    // The ECS Service used for deploying tasks 
    const service = new ecs.FargateService(this, "ECS-Service", {
      cluster,
      desiredCount: 1,
      taskDefinition,
      securityGroups: [ecsSG],
      assignPublicIp: true,
    });

    // Target group to make resources containers discoverable by the ALB
    const targetGroupHttp = new elasticloadbalancing.ApplicationTargetGroup(
      this,
      "ALB-TargetGroup",
      {
        port: applicationPort,
        vpc: vpc,
        protocol: elasticloadbalancing.ApplicationProtocol.HTTP,
        targetType: elasticloadbalancing.TargetType.IP,
      }
    );

    // Health check for containers to check they were deployed correctly
    targetGroupHttp.configureHealthCheck({
      path: "/api/status",
      protocol: elasticloadbalancing.Protocol.HTTP,
    });

    // Only allow HTTPS connections 
    const listener = alb.addListener("ALB-Listener", {
      open: true,
      port: 443,
      certificates: [certificate],
    });

    listener.addTargetGroups("ALB-Listener-TargetGroup", {
      targetGroups: [targetGroupHttp],
    });

    // Add the ECS service to the target group of the ALB 
    service.attachToApplicationTargetGroup(targetGroupHttp);

    // // TODO: Add ASG if needed based on memory and CPU usage
    // const scalableTaget = service.autoScaleTaskCount({
    //   minCapacity: 2,
    //   maxCapacity: 5,
    // });

    // scalableTaget.scaleOnMemoryUtilization("ECS-ScaleUpMem", {
    //   targetUtilizationPercent: 75,
    // });

    // scalableTaget.scaleOnCpuUtilization("ECS-ScaleUpCPU", {
    //   targetUtilizationPercent: 75,
    // });

    // After ALB is configured, add an "A Record" in the R53 HZ for the domain
    const hostedZoneARecod = new route53.ARecord(this, 'ARecord', {
      comment: `A type Record target for ${mainResourcesName} solution in ${deploymentEnvironment} env`,
      target: route53.RecordTarget.fromAlias(new route53targets.LoadBalancerTarget(alb)),
      recordName: domainName,
      zone: hostedZone,
    });

  }
}
