import {
	SyntheticsClient,
	paginateDescribeRuntimeVersions,
	type RuntimeVersion,
} from "@aws-sdk/client-synthetics";
import type { Runtime } from "aws-cdk-lib/aws-synthetics";
import { CdkSdkVersionRunner } from "../runner";
import { getCDKSyntheticsRuntimes } from "../util/provider/synthetics";

const __MISSING_VERSION_NAME__ = "__MISSING_VERSION_NAME__";

const client = new SyntheticsClient({});
export class SyntheticsRunner extends CdkSdkVersionRunner<
	Runtime,
	RuntimeVersion
> {
	constructor() {
		super("Synthetics");
	}

	protected async generateCdkVersions() {
		return getCDKSyntheticsRuntimes();
	}

	protected async fetchSdkVersions() {
		const paginator = paginateDescribeRuntimeVersions(
			{ client, pageSize: 80 },
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
		return VersionName ?? __MISSING_VERSION_NAME__;
	}
}
