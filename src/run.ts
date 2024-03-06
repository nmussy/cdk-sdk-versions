import { KafkaVersion } from '@aws-cdk/aws-msk-alpha';
import { DescribeImagesCommand, EC2Client } from '@aws-sdk/client-ec2';
import { DescribeAddonVersionsCommand, EKSClient } from '@aws-sdk/client-eks';
import { KafkaClient, ListKafkaVersionsCommand } from '@aws-sdk/client-kafka';
import { Runtime as SDKLambdaRuntime } from '@aws-sdk/client-lambda';
import { DescribeDBEngineVersionsCommand, RDSClient } from '@aws-sdk/client-rds';
import { DescribeRuntimeVersionsCommand, SyntheticsClient } from '@aws-sdk/client-synthetics';
import { WindowsVersion } from 'aws-cdk-lib/aws-ec2';
import { KubernetesVersion } from 'aws-cdk-lib/aws-eks';
import { Runtime as CDKLambdaRuntime } from 'aws-cdk-lib/aws-lambda';
import { MysqlEngineVersion, OracleEngineVersion } from 'aws-cdk-lib/aws-rds';
import { Runtime as CDKSynRuntime } from 'aws-cdk-lib/aws-synthetics';

const rdsClient = new RDSClient({});
const ec2Client = new EC2Client({});
const eksClient = new EKSClient({});
const synClient = new SyntheticsClient({});
const kafkaClient = new KafkaClient({});

const run = async () => {
    const mysql = await rdsClient.send(new DescribeDBEngineVersionsCommand({
        Engine: 'mysql',
    }));
    
    console.log(OracleEngineVersion, MysqlEngineVersion);

    // aws ec2 describe-images --owners amazon --filters "Name=name,Values=Windows_Server*" --query 'sort_by(Images, &CreationDate)[].Name'
    const windows = await ec2Client.send(new DescribeImagesCommand({
        Owners: ['amazon'],
        Filters: [
            { Name: 'name', Values: ['Windows_Server*'] },
        ],
    }));

    console.log(WindowsVersion);

    // aws eks describe-addon-versions | jq -r ".addons[] | .addonVersions[] | .compatibilities[] | .clusterVersion" | sort | uniq
    const k8s = await eksClient.send(new DescribeAddonVersionsCommand({}));

    console.log(KubernetesVersion);

    const lambdaRuntimes = Object.entries(SDKLambdaRuntime);

    console.log(CDKLambdaRuntime);

    const synRuntimes = await synClient.send(new DescribeRuntimeVersionsCommand({}));

    console.log(CDKSynRuntime);

    const kafkaVersions = await kafkaClient.send(new ListKafkaVersionsCommand({}));

    console.log(KafkaVersion);
};

void run();
