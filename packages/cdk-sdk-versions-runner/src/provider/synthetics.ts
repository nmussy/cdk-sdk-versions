import {
	type RuntimeVersion,
	SyntheticsClient,
	paginateDescribeRuntimeVersions,
} from "@aws-sdk/client-synthetics";
import { CONSOLE_SYMBOLS } from "../util";
import { getCDKSyntheticsRuntimes } from "../util/provider/synthetics";

const client = new SyntheticsClient({});

export const getRuntimeVersions = async () => {
	const paginator = paginateDescribeRuntimeVersions(
		{ client, pageSize: 80 },
		{},
	);
	const versions: RuntimeVersion[] = [];
	for await (const { RuntimeVersions = [] } of paginator) {
		versions.push(...RuntimeVersions);
	}
	return versions;
};

const runSynthetics = async () => {
	const cdkVersions = getCDKSyntheticsRuntimes();
	const sdkVersions = await getRuntimeVersions();

	for (const cdkVersion of cdkVersions) {
		const sdkVersion = sdkVersions.find(
			({ VersionName = "" }) => cdkVersion.runtime.name === VersionName,
		);

		const isSdkDeprecated =
			sdkVersion?.DeprecationDate && sdkVersion.DeprecationDate < new Date();

		if (!sdkVersion) {
			console.log(CONSOLE_SYMBOLS.DELETE, cdkVersion.runtime.name);
		} else if (!cdkVersion.isDeprecated && isSdkDeprecated) {
			console.log(
				CONSOLE_SYMBOLS.UPDATE,
				cdkVersion.runtime.name,
				"@deprecated",
			);
		} else if (cdkVersion.isDeprecated && !isSdkDeprecated) {
			console.log(
				CONSOLE_SYMBOLS.UPDATE,
				cdkVersion.runtime.name,
				"not @deprecated",
			);
		}
	}

	for (const sdkVersion of sdkVersions) {
		if (!sdkVersion.VersionName) continue;

		const cdkVersion = cdkVersions.find(
			({ runtime: { name } }) => name === sdkVersion.VersionName,
		);

		const isSdkDeprecated =
			sdkVersion?.DeprecationDate && sdkVersion.DeprecationDate < new Date();

		if (!cdkVersion) {
			console.log(
				CONSOLE_SYMBOLS.ADD,
				sdkVersion.VersionName,
				isSdkDeprecated ? "@deprecated" : "",
			);
		}
	}
};

if (process.env.NODE_ENV !== "test") void runSynthetics();
