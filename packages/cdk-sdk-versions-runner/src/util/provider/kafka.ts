import { KafkaVersion } from "@aws-cdk/aws-msk-alpha";
import type { DeprecableVersion } from "../../runner";
import { CdkModulePath } from "../cdk";
import { getStaticFieldComments } from "../tsdoc";

export const CDK_MSK_ALPHA_CLUSTER_VERSION_PATH = new CdkModulePath(
	"@aws-cdk/aws-msk-alpha",
	"lib/cluster-version.d.ts",
);

const kafkaConstructorRegex = /KafkaVersion\.of\('(?<versionName>[\d.]+)'\)/;

export const getCDKKafkaVersions = () => {
	const kafkaVersions: DeprecableVersion<KafkaVersion>[] = [];

	for (const { fieldName, fieldValue, isDeprecated } of getStaticFieldComments(
		CDK_MSK_ALPHA_CLUSTER_VERSION_PATH.auto,
	)) {
		let version: KafkaVersion;
		if (fieldName in KafkaVersion) {
			version = KafkaVersion[
				fieldName as keyof typeof KafkaVersion
			] as KafkaVersion;
		} else {
			const match = fieldValue.match(kafkaConstructorRegex);
			if (!match?.groups) throw new Error(`Unknown version: ${fieldValue}`);
			const {
				groups: { versionName },
			} = match;
			console.warn(
				`Unknown version: ${fieldName}, replacing with KafkaVersion.of("${versionName}")`,
			);
			version = KafkaVersion.of(versionName);
		}

		kafkaVersions.push({ version, isDeprecated });
	}

	return kafkaVersions;
};
