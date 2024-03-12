import {
	OpenSearchClient,
	paginateListVersions,
} from "@aws-sdk/client-opensearch";
import { EngineVersion } from "aws-cdk-lib/aws-opensearchservice";

const client = new OpenSearchClient();

const getSdkOpenSearchVersions = async () => {
	const versions: string[] = [];

	const paginator = paginateListVersions({ client, pageSize: 100 }, {});

	for await (const { Versions = [] } of paginator) {
		versions.push(...Versions);
	}

	console.log(versions);

	return versions;
};

console.log(EngineVersion);
getSdkOpenSearchVersions();
