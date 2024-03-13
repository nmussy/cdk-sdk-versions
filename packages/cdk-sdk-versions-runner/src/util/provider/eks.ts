import { AlbControllerVersion } from "aws-cdk-lib/aws-eks";
import type { DeprecableVersion } from "../../runner";
import { CdkLibPath } from "../cdk";
import { getStaticFieldComments } from "../tsdoc";

export const CDK_LIB_EKS_ALB_CONTROLLER_PATH = new CdkLibPath(
	"aws-eks/lib/alb-controller.ts",
);

const constructorRegex =
	/new AlbControllerVersion\('(?<versionName>[\w.-]+)', '(?<helmVersion>[\w.-]+)',false\)/;

export const getCDKEKSAlbControllerVersions = () => {
	const runtimes: DeprecableVersion<AlbControllerVersion>[] = [];

	for (const {
		className,
		fieldName,
		fieldValue,
		isDeprecated,
	} of getStaticFieldComments(CDK_LIB_EKS_ALB_CONTROLLER_PATH.auto)) {
		if (className !== "AlbControllerVersion") continue;

		let version: AlbControllerVersion;
		if (fieldName in AlbControllerVersion) {
			version = AlbControllerVersion[
				fieldName as keyof typeof AlbControllerVersion
			] as AlbControllerVersion;
		} else {
			const match = fieldValue.match(constructorRegex);
			console.log(match?.groups);
			if (!match?.groups) throw new Error(`Unknown version: ${fieldValue}`);
			const {
				groups: { versionName, helmVersion },
			} = match;
			console.warn(
				`Unknown version: ${fieldName}, replacing with new AlbControllerVersion.of("${versionName}", "${helmVersion}")`,
			);
			version = AlbControllerVersion.of(versionName, helmVersion);
		}

		runtimes.push({ version, isDeprecated });
	}

	return runtimes;
};
