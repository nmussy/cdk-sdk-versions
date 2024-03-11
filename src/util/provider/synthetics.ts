import { Runtime, RuntimeFamily } from "aws-cdk-lib/aws-synthetics";
import { CdkLibPath } from "../cdk";
import { getStaticFieldComments } from "../tsdoc";

export const CDK_LIB_SYNTHETICS_RUNTIME_PATH = new CdkLibPath(
	"aws-synthetics/lib/runtime.d.ts",
);

export interface DeprecableRuntime {
	runtime: Runtime;
	isDeprecated: boolean;
}

const runtimeConstructorRegex =
	/new Runtime\('(?<versionName>[\w.-]+)', RuntimeFamily\.(?<runtimeFamily>\w+)\)/;

export const getCDKSyntheticsRuntimes = () => {
	const runtimes: DeprecableRuntime[] = [];

	for (const { fieldName, fieldValue, isDeprecated } of getStaticFieldComments(
		CDK_LIB_SYNTHETICS_RUNTIME_PATH.auto,
	)) {
		let runtime: Runtime;
		if (fieldName in Runtime) {
			runtime = Runtime[fieldName as keyof typeof Runtime] as Runtime;
		} else {
			const match = fieldValue.match(runtimeConstructorRegex);
			if (!match?.groups) throw new Error(`Unknown version: ${fieldValue}`);
			const {
				groups: { versionName, runtimeFamily },
			} = match;
			console.warn(
				`Unknown version: ${fieldName}, replacing with new Runtime("${versionName}", RuntimeFamily.${runtimeFamily})`,
			);
			runtime = new Runtime(
				versionName,
				RuntimeFamily[runtimeFamily as keyof typeof RuntimeFamily],
			);
		}

		runtimes.push({ runtime, isDeprecated });
	}

	return runtimes;
};
