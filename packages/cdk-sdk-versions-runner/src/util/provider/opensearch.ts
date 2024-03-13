import { EngineVersion } from "aws-cdk-lib/aws-opensearchservice";
import type { DeprecableVersion } from "../../runner";
import { CdkLibPath } from "../cdk";
import { getStaticFieldComments } from "../tsdoc";

export const CDK_LIB_OPENSEARCH_ENGINE_VERSION_PATH = new CdkLibPath(
	"aws-opensearchservice/lib/version.d.ts",
);

const constructorRegex =
	/EngineVersion.(?<engineName>\w+)\('(?<versionName>[\w.-]+)'\)/;

export const getCDKOpenSearchEngineVersions = () => {
	const runtimes: DeprecableVersion<EngineVersion>[] = [];

	for (const { fieldName, fieldValue, isDeprecated } of getStaticFieldComments(
		CDK_LIB_OPENSEARCH_ENGINE_VERSION_PATH.auto,
	)) {
		let version: EngineVersion;
		if (fieldName in EngineVersion) {
			version = EngineVersion[
				fieldName as keyof typeof EngineVersion
			] as EngineVersion;
		} else {
			const match = fieldValue.match(constructorRegex);
			if (!match?.groups) throw new Error(`Unknown version: ${fieldValue}`);
			const {
				groups: { engineName, versionName },
			} = match;
			console.warn(
				`Unknown version: ${fieldName}, replacing with EngineVersion.${engineName}("${versionName}")`,
			);
			version =
				EngineVersion[engineName as "openSearch" | "elasticsearch"](
					versionName,
				);
		}

		runtimes.push({ version, isDeprecated });
	}

	return runtimes;
};
