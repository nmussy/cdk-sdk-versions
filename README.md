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

* Lambda
    * Create one function of each runtime, check if they become deprecated
 
## Lack of API support

* CodeBuild
    * `LinuxGpuBuildImage`, see [issue](https://github.com/aws/deep-learning-containers/issues/2732)
* Lambda
    * No way to get current list of available runtimes, can use `@aws-sdk/client-lambda.Runtime` with Dependabot instead?
* Kubernetes
    * No easy way to get list of available/deprecated versions, might be able to use the `DescribeAddonVersions` endpoint, but less than ideal
