# cdk-sdk-versions-runner

## CDK constructs

### Supported

- RDS
  - [`PostgresEngineVersion`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_rds.PostgresEngineVersion.html)
  * [`MysqlEngineVersion`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_rds.MysqlEngineVersion.html)
  * [`MariaDbEngineVersion`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_rds.MariaDbEngineVersion.html)
  * [`OracleEngineVersion`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_rds.OracleEngineVersion.html)
  * [`SqlServerEngineVersion`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_rds.SqlServerEngineVersion.html)
  * [`AuroraMysqlEngineVersion`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_rds.AuroraMysqlEngineVersion.html)
  * [`AuroraPostgresEngineVersion`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_rds.AuroraPostgresEngineVersion.html)
- CodeBuild
  - [`WindowsBuildImage`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_codebuild.WindowsBuildImage.html)
  - [`LinuxBuildImage`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_codebuild.LinuxBuildImage.html)
  - [`LinuxArmBuildImage`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_codebuild.LinuxArmBuildImage.html)
  - [`LinuxLambdaBuildImage`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_codebuild.LinuxLambdaBuildImage.html)
  - [`LinuxArmLambdaBuildImage`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_codebuild.LinuxArmLambdaBuildImage.html)
- EC2
  - [`WindowsVersion`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.WindowsVersion.html)
  - [`InstanceClass`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.InstanceClass.html)
  - [`InstanceSize`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.InstanceSize.html)
- Kafka
  - [`KafkaVersion`](https://docs.aws.amazon.com/cdk/api/v2/docs/@aws-cdk_aws-msk-alpha.KafkaVersion.html)
- Bedrock
  - [`FoundationModelIdentifier`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_bedrock.FoundationModelIdentifier.html)
- OpenSearch Service
  - [`EngineVersion`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_opensearchservice.EngineVersion.html)
- EKS
  - [`AlbControllerVersion`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_eks.AlbControllerVersion.html)

### Upcoming support

- EC2
  - [`InterfaceVpcEndpointAwsService`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.InterfaceVpcEndpointAwsService.html), using [DescribeVpcEndpointServices](https://docs.aws.amazon.com/AWSEC2/latest/APIReference/API_DescribeVpcEndpointServices.html)
  - Instance properties, see [aws-cdk#12022](https://github.com/aws/aws-cdk/issues/12022)

### Unsupported due to lack of API support

- CodeBuild
  - [`LinuxGpuBuildImage`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_codebuild.LinuxGpuBuildImage.html), see [issue](https://github.com/aws/deep-learning-containers/issues/2732)
- Lambda
  - [`Runtime`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda.Runtime.html) No way to get current list of available runtimes, can use `@aws-sdk/client-lambda.Runtime` with Dependabot instead? This wouldn't help obtaining the `@deprecated`
- Glue
  - [`GlueVersion`](https://docs.aws.amazon.com/cdk/api/v2/docs/@aws-cdk_aws-glue-alpha.GlueVersion.html)
- Neptune
  - [`EngineVersion`](https://docs.aws.amazon.com/cdk/api/v2/docs/@aws-cdk_aws-neptune-alpha.EngineVersion.html)
- EKS
  - [`KubernetesVersion`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_eks.KubernetesVersion.html) No easy way to get list of available/deprecated versions, might be able to use the `DescribeAddonVersions` endpoint, but less than ideal

#### Amazon Lambda Layers

These could be solved by adding an API endpoint to get the list of Amazon-provided layers. There is a web console API, `GET /lambda-api/server/aws-vended-layers`, used in the "Add layer" page

- CloudWatch
  - [`LambdaInsightsVersion`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda.LambdaInsightsVersion.html)
    - `CLOUDWATCH_LAMBDA_INSIGHTS_ARNS`, see [docs](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Lambda-Insights-extension-versions.html)
- AppConfig
  - [`getLambdaLayerVersionArn`](https://docs.aws.amazon.com/cdk/api/v2/docs/@aws-cdk_aws-appconfig-alpha.Application.html#static-getwbrlambdawbrlayerwbrversionwbrarnregion-platformspan-classapi-icon-api-icon-deprecated-titlethis-api-element-is-deprecated-its-use-is-not-recommended%EF%B8%8Fspan)
    - `APPCONFIG_LAMBDA_LAYER_ARNS`, see [docs](https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-integration-lambda-extensions-versions.html#appconfig-integration-lambda-extensions-versions-release-notes)
- Secrets Manager
  - [`ParamsAndSecretsLayerVersion`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda.ParamsAndSecretsLayerVersion.html)
    - `PARAMS_AND_SECRETS_LAMBDA_LAYER_ARNS`, see [docs](https://docs.aws.amazon.com/secretsmanager/latest/userguide/retrieving-secrets_lambda.html#retrieving-secrets_lambda_ARNs)
- Lambda
  - [`AdotLambdaLayerGenericVersion`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda.AdotLambdaLayerGenericVersion.html), [`AdotLambdaLayerJavaAutoInstrumentationVersion`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda.AdotLambdaLayerJavaAutoInstrumentationVersion.html), etc.
    - `ADOT_LAMBDA_LAYER_ARNS`, might be able to use [`open-telemetry` GH releases](https://github.com/open-telemetry/opentelemetry-java)
