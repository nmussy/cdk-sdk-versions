import { KafkaVersion } from "@aws-cdk/aws-msk-alpha";
import { CdkModulePath } from "../cdk";
import { getStaticFieldComments } from "../tsdoc";

export const CDK_MSK_ALPHA_CLUSTER_VERSION_PATH = new CdkModulePath(
	"@aws-cdk/aws-msk-alpha",
	"lib/cluster-version.d.ts",
);
export interface DeprecableKafkaVersion {
	kafkaVersion: KafkaVersion;
	isDeprecated: boolean;
}

const kafkaConstructorRegex = /KafkaVersion\.of\('(?<version>[\d.]+)'\)/;

export const getCDKKafkaVersions = () => {
	const kafkaVersions: DeprecableKafkaVersion[] = [];

	for (const { fieldName, fieldValue, isDeprecated } of getStaticFieldComments(
		CDK_MSK_ALPHA_CLUSTER_VERSION_PATH.auto,
	)) {
		let kafkaVersion: KafkaVersion;
		if (fieldName in KafkaVersion) {
			kafkaVersion = KafkaVersion[
				fieldName as keyof typeof KafkaVersion
			] as KafkaVersion;
		} else {
			const match = fieldValue.match(kafkaConstructorRegex);
			if (!match?.groups) throw new Error(`Unknown version: ${fieldValue}`);
			const {
				groups: { version },
			} = match;
			console.warn(
				`Unknown version: ${fieldName}, replacing with KafkaVersion.of("${version}")`,
			);
			kafkaVersion = KafkaVersion.of(version);
		}

		kafkaVersions.push({
			kafkaVersion,
			isDeprecated,
		});
	}

	return kafkaVersions;
};
