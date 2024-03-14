import type { KafkaVersion as CDKKafkaVersion } from "@aws-cdk/aws-msk-alpha";
import {
	KafkaClient,
	KafkaVersionStatus,
	paginateListKafkaVersions,
	type KafkaVersion as SDKKafkaVersion,
} from "@aws-sdk/client-kafka";
import { CdkSdkVersionRunner } from "../runner";
import { getCDKKafkaVersions } from "../util/provider/kafka";

const client = new KafkaClient({});

const __MISSING_VERSION__ = "__MISSING_VERSION__";

export class KafkaRunner extends CdkSdkVersionRunner<
	CDKKafkaVersion,
	SDKKafkaVersion
> {
	constructor() {
		super("Kafka");
	}

	protected async generateCdkVersions() {
		return getCDKKafkaVersions();
	}
	protected async fetchSdkVersions() {
		const versions: SDKKafkaVersion[] = [];
		const paginator = paginateListKafkaVersions({ client, pageSize: 100 }, {});
		for await (const { KafkaVersions = [] } of paginator) {
			versions.push(...KafkaVersions);
		}

		return versions.map((version) => ({
			version,
			isDeprecated: version.Status !== KafkaVersionStatus.ACTIVE,
		}));
	}

	protected getCdkVersionId({ version }: CDKKafkaVersion) {
		return version;
	}

	protected getSdkVersionId({ Version }: SDKKafkaVersion) {
		return Version ?? __MISSING_VERSION__;
	}
}
