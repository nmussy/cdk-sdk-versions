import { KafkaVersion as CDKKafkaVersion } from "@aws-cdk/aws-msk-alpha";
import {
	KafkaClient,
	KafkaVersion as SDKKafkaVersion,
	paginateListKafkaVersions,
} from "@aws-sdk/client-kafka";

const client = new KafkaClient({});

export const getKafkaVersions = async () => {
	const versions: SDKKafkaVersion[] = [];
	const paginator = paginateListKafkaVersions({ client, pageSize: 100 }, {});
	for await (const { KafkaVersions = [] } of paginator) {
		versions.push(...KafkaVersions);
	}
};

console.log(CDKKafkaVersion);
