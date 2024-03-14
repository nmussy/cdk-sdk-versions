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

	protected async generateCdkVersions() {
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

	protected getCdkVersionId({ version }: EngineVersion) {
		return version;
	}

	protected getSdkVersionId(version: string) {
		return version;
	}
}
