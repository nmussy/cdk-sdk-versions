import { EngineVersion } from "aws-cdk-lib/aws-opensearchservice";
import { CdkLibPath } from "../cdk";
import { getStaticFieldComments } from "../tsdoc";

export const CDK_LIB_OPENSEARCH_ENGINE_VERSION_PATH = new CdkLibPath(
	"aws-opensearchservice/lib/version.d.ts",
);

export interface DeprecableEngineVersion {
	engineVersion: EngineVersion;
	isDeprecated: boolean;
}

type EngineName = "openSearch" | "elasticsearch";
const constructorRegex =
	/EngineVersion.(?<engineName>\w+)\('(?<versionName>[\w.-]+)'\)/;

export const getCDKOpenSearchEngineVersions = () => {
	const runtimes: DeprecableEngineVersion[] = [];

	for (const { fieldName, fieldValue, isDeprecated } of getStaticFieldComments(
		CDK_LIB_OPENSEARCH_ENGINE_VERSION_PATH.auto,
	)) {
		let engineVersion: EngineVersion;
		if (fieldName in EngineVersion) {
			engineVersion = EngineVersion[
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
			engineVersion = EngineVersion[engineName as EngineName](versionName);
		}

		runtimes.push({ engineVersion, isDeprecated });
	}

	return runtimes;
};
