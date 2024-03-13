import { AlbControllerVersion } from "aws-cdk-lib/aws-eks";
import { CdkLibPath } from "../cdk";
import { getStaticFieldComments } from "../tsdoc";

export const CDK_LIB_EKS_ALB_CONTROLLER_PATH = new CdkLibPath(
	"aws-eks/lib/alb-controller.ts",
);

export interface DeprecableAlbControllerVersion {
	engineVersion: AlbControllerVersion;
	isDeprecated: boolean;
}

const constructorRegex =
	/new AlbControllerVersion\('(?<versionName>[\w.-]+)', '(?<helmVersion>[\w.-]+)',false\)/;

export const getCDKEKSAlbControllerVersions = () => {
	const runtimes: DeprecableAlbControllerVersion[] = [];

	for (const {
		className,
		fieldName,
		fieldValue,
		isDeprecated,
	} of getStaticFieldComments(CDK_LIB_EKS_ALB_CONTROLLER_PATH.auto)) {
		if (className !== "AlbControllerVersion") continue;

		let engineVersion: AlbControllerVersion;
		if (fieldName in AlbControllerVersion) {
			engineVersion = AlbControllerVersion[
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
			engineVersion = AlbControllerVersion.of(versionName, helmVersion);
		}

		runtimes.push({ engineVersion, isDeprecated });
	}

	return runtimes;
};
