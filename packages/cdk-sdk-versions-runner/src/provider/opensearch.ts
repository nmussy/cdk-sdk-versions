import {
	OpenSearchClient,
	paginateListVersions,
} from "@aws-sdk/client-opensearch";
import type { EngineVersion } from "aws-cdk-lib/aws-opensearchservice";
import { CdkSdkVersionRunner } from "../runner";
import { getCDKOpenSearchEngineVersions } from "../util/provider/opensearch";

const client = new OpenSearchClient();

export class OpenSearchRunner extends CdkSdkVersionRunner<
	EngineVersion,
	string
> {
	constructor() {
		super("OpenSearch");
	}

	protected getCdkVersions() {
		return getCDKOpenSearchEngineVersions();
	}
	protected async fetchSdkVersions() {
		const versions: string[] = [];

		const paginator = paginateListVersions({ client, pageSize: 100 }, {});

		for await (const { Versions = [] } of paginator) {
			versions.push(...Versions);
		}

		return versions.map((version) => ({ version, isDeprecated: false }));
	}

	protected stringifyCdkVersion({ version }: EngineVersion) {
		return version;
	}

	protected stringifySdkVersion(version: string) {
		return version;
	}

	protected compareCdkSdkVersions(cdk: EngineVersion, sdk: string) {
		return cdk.version === sdk;
	}
}
