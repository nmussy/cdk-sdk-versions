import {
	OpenSearchClient,
	paginateListVersions,
} from "@aws-sdk/client-opensearch";
import { EngineVersion } from "aws-cdk-lib/aws-opensearchservice";
import {
	CdkSdkVersionRunner,
	VersionStorageType,
	type DeprecableVersion,
} from "../runner";
import { CdkLibPath } from "../util/cdk";
import { getStaticFieldComments } from "../util/tsdoc";

export class OpenSearchRunner extends CdkSdkVersionRunner<
	EngineVersion,
	string
> {
	private static readonly client = new OpenSearchClient({});

	public static readonly versionPath = new CdkLibPath(
		"aws-opensearchservice/lib/version.d.ts",
	);
	private static readonly engineVersionConstructorRegex =
		/EngineVersion.(?<engineName>\w+)\('(?<versionName>[\w.-]+)'\)/;

	constructor() {
		super("OpenSearch", {
			storageType: VersionStorageType.ClassWithStaticMembers,
			className: "EngineVersion",
			// FIXME
			factoryMethod: '"openSearch" | "elasticsearch"',
		});
	}

	protected async generateCdkVersions() {
		const runtimes: DeprecableVersion<EngineVersion>[] = [];

		for (const {
			fieldName,
			fieldValue,
			isDeprecated,
		} of getStaticFieldComments(OpenSearchRunner.versionPath.auto)) {
			let version: EngineVersion;
			if (fieldName in EngineVersion) {
				version = EngineVersion[
					fieldName as keyof typeof EngineVersion
				] as EngineVersion;
			} else {
				const match = fieldValue.match(
					OpenSearchRunner.engineVersionConstructorRegex,
				);
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
	}
	protected async fetchSdkVersions() {
		const versions: string[] = [];

		const paginator = paginateListVersions(
			{ client: OpenSearchRunner.client, pageSize: 100 },
			{},
		);

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
