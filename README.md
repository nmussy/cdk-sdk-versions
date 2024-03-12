# cdk-sdk-versions

## Supported CDK constructs

* [x] RDS
    * [`PostgresEngineVersion`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_rds.PostgresEngineVersion.html)
    * [`MysqlEngineVersion`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_rds.MysqlEngineVersion.html)
    * [`MariaDbEngineVersion`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_rds.MariaDbEngineVersion.html)
    * [`OracleEngineVersion`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_rds.OracleEngineVersion.html)
    * [`SqlServerEngineVersion`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_rds.SqlServerEngineVersion.html)
    * [`AuroraMysqlEngineVersion`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_rds.AuroraMysqlEngineVersion.html)
    * [`AuroraPostgresEngineVersion`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_rds.AuroraPostgresEngineVersion.html)
* [x] CodeBuild
    * [`WindowsBuildImage`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_codebuild.WindowsBuildImage.html)
    * [`LinuxBuildImage`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_codebuild.LinuxBuildImage.html)
    * [`LinuxArmBuildImage`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_codebuild.LinuxArmBuildImage.html)
    * [`LinuxLambdaBuildImage`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_codebuild.LinuxLambdaBuildImage.html)
    * [`LinuxArmLambdaBuildImage`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_codebuild.LinuxArmLambdaBuildImage.html)
* [x] EC2
    * [`WindowsVersion`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.WindowsVersion.html)
    * [`InstanceClass`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.InstanceClass.html)
    * [`InstanceSize`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.InstanceSize.html)
* [x] Kafka
    * [`KafkaVersion`](https://docs.aws.amazon.com/cdk/api/v2/docs/@aws-cdk_aws-msk-alpha.KafkaVersion.html)

## TODO

* OpenSearch Service
    * [`EngineVersion`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_opensearchservice.EngineVersion.html)
        * API: https://docs.aws.amazon.com/opensearch-service/latest/APIReference/API_ListVersions.html
* [ ] [`Lambda.Runtime` `@deprecated`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda.Runtime.html)
    * Create one function of each runtime, check if they become deprecated
* EKS
    * [`AlbControllerVersion`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_eks.AlbControllerVersion.html)
        * `aws ecr list-images --repository-name amazon/aws-load-balancer-controller --registry-id 602401143452`
* Lambda
    * `ADOT_LAMBDA_LAYER_ARNS`, [`AdotLambdaLayerGenericVersion`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda.AdotLambdaLayerGenericVersion.html)
        * Might be able to use GH releases? https://github.com/open-telemetry/opentelemetry-java

## Lack of API support

* CodeBuild
    * `LinuxGpuBuildImage`, see [issue](https://github.com/aws/deep-learning-containers/issues/2732)
* Lambda
    * No way to get current list of available runtimes, can use `@aws-sdk/client-lambda.Runtime` with Dependabot instead?
* AppConfig
    * `APPCONFIG_LAMBDA_LAYER_ARNS`, see [docs](https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-integration-lambda-extensions-versions.html#appconfig-integration-lambda-extensions-versions-release-notes)
* SSM
    * `PARAMS_AND_SECRETS_LAMBDA_LAYER_ARNS`, see [docs](https://docs.aws.amazon.com/secretsmanager/latest/userguide/retrieving-secrets_lambda.html#retrieving-secrets_lambda_ARNs)
* Kubernetes
    * No easy way to get list of available/deprecated versions, might be able to use the `DescribeAddonVersions` endpoint, but less than ideal
* Glue
    * `GlueVersion`
* Neptune
    * [`EngineVersion`](https://docs.aws.amazon.com/cdk/api/v2/docs/@aws-cdk_aws-neptune-alpha.EngineVersion.html)
* EKS
    * [`KubernetesVersion`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_eks.KubernetesVersion.html)
* CloudWatch
    * `CLOUDWATCH_LAMBDA_INSIGHTS_ARNS`, see [docs](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Lambda-Insights-extension-versions.html)


TODO check list amazon layers `aws lambda list-layers`?
