import {
	SyntheticsClient,
	paginateDescribeRuntimeVersions,
	type RuntimeVersion,
} from "@aws-sdk/client-synthetics";
import { Runtime, RuntimeFamily } from "aws-cdk-lib/aws-synthetics";
import {
	CdkSdkVersionRunner,
	VersionStorageType,
	type DeprecableVersion,
} from "../runner";
import { CdkLibPath } from "../util/cdk";
import { getStaticFieldComments } from "../util/tsdoc";

export class SyntheticsRunner extends CdkSdkVersionRunner<
	Runtime,
	RuntimeVersion
> {
	private static readonly client = new SyntheticsClient({});

	public static readonly runtimePath = new CdkLibPath(
		"aws-synthetics/lib/runtime.d.ts",
	);
	private static readonly runtimeConstructorRegex =
		/new Runtime\('(?<versionName>[\w.-]+)', RuntimeFamily\.(?<runtimeFamily>\w+)\)/;

	public static readonly __MISSING_VERSION_NAME__ = "__MISSING_VERSION_NAME__";

	constructor() {
		super("Synthetics", {
			storageType: VersionStorageType.ClassWithStaticMembers,
			className: "Runtime",
			// TODO add RuntimeFamily.${runtimeFamily}
		});
	}

	protected async generateCdkVersions() {
		const runtimes: DeprecableVersion<Runtime>[] = [];

		for (const {
			fieldName,
			fieldValue,
			isDeprecated,
		} of getStaticFieldComments(SyntheticsRunner.runtimePath.auto)) {
			let version: Runtime;
			if (fieldName in Runtime) {
				version = Runtime[fieldName as keyof typeof Runtime] as Runtime;
			} else {
				const match = fieldValue.match(
					SyntheticsRunner.runtimeConstructorRegex,
				);
				if (!match?.groups) throw new Error(`Unknown version: ${fieldValue}`);
				const {
					groups: { versionName, runtimeFamily },
				} = match;
				console.warn(
					`Unknown version: ${fieldName}, replacing with new Runtime("${versionName}", RuntimeFamily.${runtimeFamily})`,
				);
				version = new Runtime(
					versionName,
					RuntimeFamily[runtimeFamily as keyof typeof RuntimeFamily],
				);
			}

			runtimes.push({ version, isDeprecated });
		}

		return runtimes;
	}

	protected async fetchSdkVersions() {
		const paginator = paginateDescribeRuntimeVersions(
			{ client: SyntheticsRunner.client, pageSize: 80 },
			{},
		);
		const versions: RuntimeVersion[] = [];
		for await (const { RuntimeVersions = [] } of paginator) {
			versions.push(...RuntimeVersions);
		}

		const now = new Date();

		return versions.map((version) => ({
			version,
			isDeprecated: !!(
				version.DeprecationDate && version.DeprecationDate < now
			),
		}));
	}

	protected getCdkVersionId({ name }: Runtime) {
		return name;
	}

	protected getSdkVersionId({ VersionName }: RuntimeVersion) {
		return VersionName ?? SyntheticsRunner.__MISSING_VERSION_NAME__;
	}
}
