import {
	KafkaVersion,
	type KafkaVersion as CDKKafkaVersion,
} from "@aws-cdk/aws-msk-alpha";
import {
	KafkaClient,
	KafkaVersionStatus,
	paginateListKafkaVersions,
	type KafkaVersion as SDKKafkaVersion,
} from "@aws-sdk/client-kafka";
import {
	CdkSdkVersionRunner,
	VersionStorageType,
	type DeprecableVersion,
} from "../runner";
import { CdkModulePath } from "../util/cdk";
import { getStaticFieldComments } from "../util/tsdoc";

const __MISSING_VERSION__ = "__MISSING_VERSION__";

export class KafkaRunner extends CdkSdkVersionRunner<
	CDKKafkaVersion,
	SDKKafkaVersion
> {
	private static readonly client = new KafkaClient({});
	private static readonly clusterVersionPath = new CdkModulePath(
		"@aws-cdk/aws-msk-alpha",
		"lib/cluster-version.d.ts",
	);
	private static readonly kafkaVersionFactoryRegex =
		/KafkaVersion\.of\('(?<versionName>[\d.]+)'\)/;

	public static readonly __MISSING_VERSION__ = "__MISSING_VERSION__";

	constructor() {
		super("Kafka", {
			storageType: VersionStorageType.ClassWithStaticMembers,
			className: "KafkaVersion",
			factoryMethod: "of",
		});
	}

	protected async generateCdkVersions() {
		const kafkaVersions: DeprecableVersion<KafkaVersion>[] = [];

		for (const {
			fieldName,
			fieldValue,
			isDeprecated,
		} of getStaticFieldComments(KafkaRunner.clusterVersionPath.auto)) {
			let version: KafkaVersion;
			if (fieldName in KafkaVersion) {
				version = KafkaVersion[
					fieldName as keyof typeof KafkaVersion
				] as KafkaVersion;
			} else {
				const match = fieldValue.match(KafkaRunner.kafkaVersionFactoryRegex);
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
	}
	protected async fetchSdkVersions() {
		const versions: SDKKafkaVersion[] = [];
		const paginator = paginateListKafkaVersions(
			{ client: KafkaRunner.client, pageSize: 100 },
			{},
		);
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
