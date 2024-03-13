import {
	KafkaClient,
	KafkaVersionStatus,
	paginateListKafkaVersions,
	type KafkaVersion as SDKKafkaVersion,
} from "@aws-sdk/client-kafka";
import { CONSOLE_SYMBOLS } from "../util";
import { getCDKKafkaVersions } from "../util/provider/kafka";

const client = new KafkaClient({});

export const getKafkaVersions = async () => {
	const versions: SDKKafkaVersion[] = [];
	const paginator = paginateListKafkaVersions({ client, pageSize: 100 }, {});
	for await (const { KafkaVersions = [] } of paginator) {
		versions.push(...KafkaVersions);
	}

	return versions;
};

const runKafka = async () => {
	const sdkVersions = await getKafkaVersions();
	const cdkVersions = getCDKKafkaVersions();

	for (const cdkVersion of cdkVersions) {
		const sdkVersion = sdkVersions.find(
			({ Version = "" }) => cdkVersion.kafkaVersion.version === Version,
		);

		if (!sdkVersion) {
			if (cdkVersion.isDeprecated) continue;

			console.log(CONSOLE_SYMBOLS.DELETE_BOX, cdkVersion.kafkaVersion.version);
		} else if (
			!cdkVersion.isDeprecated &&
			sdkVersion.Status === KafkaVersionStatus.DEPRECATED
		) {
			console.log(
				CONSOLE_SYMBOLS.UPDATE_BOX,
				cdkVersion.kafkaVersion.version,
				"@deprecated",
			);
		} else if (
			cdkVersion.isDeprecated &&
			sdkVersion.Status === KafkaVersionStatus.ACTIVE
		) {
			console.log(
				CONSOLE_SYMBOLS.UPDATE_BOX,
				cdkVersion.kafkaVersion.version,
				"not @deprecated",
			);
		}
	}

	for (const sdkVersion of sdkVersions) {
		if (!sdkVersion.Version) continue;

		const cdkVersion = cdkVersions.find(
			({ kafkaVersion: { version } }) => version === sdkVersion.Version,
		);

		if (!cdkVersion) {
			console.log(
				CONSOLE_SYMBOLS.ADD_BOX,
				sdkVersion.Version,
				sdkVersion.Status === KafkaVersionStatus.DEPRECATED
					? "@deprecated"
					: "",
			);
		}
	}
};

if (process.env.NODE_ENV !== "test") void runKafka();
