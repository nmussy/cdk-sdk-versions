import { Runtime, RuntimeFamily } from "aws-cdk-lib/aws-synthetics";
import type { DeprecableVersion } from "../../runner";
import { CdkLibPath } from "../cdk";
import { getStaticFieldComments } from "../tsdoc";

export const CDK_LIB_SYNTHETICS_RUNTIME_PATH = new CdkLibPath(
	"aws-synthetics/lib/runtime.d.ts",
);

const runtimeConstructorRegex =
	/new Runtime\('(?<versionName>[\w.-]+)', RuntimeFamily\.(?<runtimeFamily>\w+)\)/;

export const getCDKSyntheticsRuntimes = () => {
	const runtimes: DeprecableVersion<Runtime>[] = [];

	for (const { fieldName, fieldValue, isDeprecated } of getStaticFieldComments(
		CDK_LIB_SYNTHETICS_RUNTIME_PATH.auto,
	)) {
		let version: Runtime;
		if (fieldName in Runtime) {
			version = Runtime[fieldName as keyof typeof Runtime] as Runtime;
		} else {
			const match = fieldValue.match(runtimeConstructorRegex);
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
};
