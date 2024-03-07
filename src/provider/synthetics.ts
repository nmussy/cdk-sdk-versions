import {
	RuntimeVersion,
	SyntheticsClient,
	paginateDescribeRuntimeVersions,
} from "@aws-sdk/client-synthetics";
import { Runtime } from "aws-cdk-lib/aws-synthetics";

const client = new SyntheticsClient({});

export const getRuntimeVersions = async () => {
	const paginator = paginateDescribeRuntimeVersions(
		{ client, pageSize: 100 },
		{},
	);
	const versions: RuntimeVersion[] = [];
	for await (const { RuntimeVersions = [] } of paginator) {
		versions.push(...RuntimeVersions);
	}
};

console.log(Runtime);
