import {
	OpenSearchClient,
	paginateListVersions,
} from "@aws-sdk/client-opensearch";
import { CONSOLE_SYMBOLS } from "../util";
import { getCDKOpenSearchEngineVersions } from "../util/provider/opensearch";

const client = new OpenSearchClient();

const getSdkOpenSearchVersions = async () => {
	const versions: string[] = [];

	const paginator = paginateListVersions({ client, pageSize: 100 }, {});

	for await (const { Versions = [] } of paginator) {
		versions.push(...Versions);
	}

	return versions;
};

const runOpenSearch = async () => {
	const cdkVersions = getCDKOpenSearchEngineVersions();
	const sdkVersions = await getSdkOpenSearchVersions();

	for (const cdkVersion of cdkVersions) {
		const sdkVersion = sdkVersions.find(
			(version) => version === cdkVersion.engineVersion.version,
		);

		if (!sdkVersion) {
			console.log(CONSOLE_SYMBOLS.DELETE, cdkVersion.engineVersion.version);
		}
	}

	for (const sdkVersion of sdkVersions) {
		const cdkVersion = cdkVersions.find(
			({ engineVersion: { version } }) => version === sdkVersion,
		);

		if (!cdkVersion) {
			console.log(CONSOLE_SYMBOLS.ADD, sdkVersion);
		}
	}
};

if (process.env.NODE_ENV !== "test") void runOpenSearch();
