import {
	LinuxArmBuildImage,
	LinuxArmLambdaBuildImage,
	LinuxBuildImage,
	LinuxLambdaBuildImage,
	WindowsBuildImage,
	type IBuildImage,
} from "aws-cdk-lib/aws-codebuild";
import { join } from "node:path";
import type { Entries } from "type-fest";
import type { DeprecableVersion } from "../../runner";
import { CdkLibPath, type CdkPath } from "../cdk";
import { getStaticFieldComments, type IStaticField } from "../tsdoc";

const basePath = "aws-codebuild/lib";

export const CDK_LIB_CODEBUILD_PROJECT_PATH = new CdkLibPath(
	join(basePath, "project.d.ts"),
);
export const CDK_LIB_CODEBUILD_LINUX_ARM_PATH = new CdkLibPath(
	join(basePath, "linux-arm-build-image.d.ts"),
);
export const CDK_LIB_CODEBUILD_LAMBDA_PATH = new CdkLibPath(
	join(basePath, "linux-lambda-build-image.d.ts"),
);
export const CDK_LIB_CODEBUILD_LAMBDA_ARM_PATH = new CdkLibPath(
	join(basePath, "linux-arm-lambda-build-image.d.ts"),
);

export type BuildImageClass =
	| "WindowsBuildImage"
	| "LinuxBuildImage"
	| "LinuxArmBuildImage"
	// Pending https://github.com/aws/deep-learning-containers/issues/2732
	// | "LinuxGpuBuildImage"
	| "LinuxLambdaBuildImage"
	| "LinuxArmLambdaBuildImage";

export const getBuildClass = (imageClass: BuildImageClass) => {
	switch (imageClass) {
		case "WindowsBuildImage":
			return WindowsBuildImage;
		case "LinuxBuildImage":
			return LinuxBuildImage;
		case "LinuxArmBuildImage":
			return LinuxArmBuildImage;
		case "LinuxLambdaBuildImage":
			return LinuxLambdaBuildImage;
		case "LinuxArmLambdaBuildImage":
			return LinuxArmLambdaBuildImage;
		default:
			throw new Error(`Unknown image class: ${imageClass}`);
	}
};

const imageBuildPath: { [image in BuildImageClass]: CdkPath } = {
	WindowsBuildImage: CDK_LIB_CODEBUILD_PROJECT_PATH,
	LinuxBuildImage: CDK_LIB_CODEBUILD_PROJECT_PATH,
	LinuxArmBuildImage: CDK_LIB_CODEBUILD_LINUX_ARM_PATH,
	LinuxLambdaBuildImage: CDK_LIB_CODEBUILD_LAMBDA_PATH,
	LinuxArmLambdaBuildImage: CDK_LIB_CODEBUILD_LAMBDA_ARM_PATH,
};


const imageConstructorRegex =
	/\w+.fromCodeBuildImageId\('(?<imageId>[\w.-]+)'\)/;

const imageFromConstructorRegex = /^\s*imageId: '(?<imageId>[\w\/.:-]+)'/m;

export const getCDKCodeBuildImages = () => {
	const images: { [image in BuildImageClass]: DeprecableVersion<IBuildImage>[] } = {
		WindowsBuildImage: [],
		LinuxBuildImage: [],
		LinuxArmBuildImage: [],
		LinuxLambdaBuildImage: [],
		LinuxArmLambdaBuildImage: [],
	};

	const staticFields: { [path: string]: IStaticField[] } = {};

	for (const [imageClassName, { auto: path }] of Object.entries(
		imageBuildPath,
	) as Entries<typeof imageBuildPath>) {
		if (!staticFields[path]) {
			staticFields[path] = getStaticFieldComments(path);
		}

		for (const {
			className,
			fieldName,
			fieldValue,
			isDeprecated,
		} of staticFields[path]) {
			if (className !== imageClassName) continue;

			const imageClass = getBuildClass(imageClassName);

			let version: IBuildImage;
			if (fieldName in imageClass) {
				version = imageClass[fieldName as keyof typeof imageClass];
			} else {
				const match =
					fieldValue.match(imageConstructorRegex) ??
					fieldValue.match(imageFromConstructorRegex);

				if (!match?.groups) throw new Error(`Unknown version: ${fieldValue}`);
				const {
					groups: { imageId },
				} = match;
				console.warn(
					`Unknown version: ${fieldName}, replacing with new ${className}("${imageId}")`,
				);

				// FIXME cannot use .fromCodeBuildImageId(), missing from WindowsBuildImage
				// @ts-ignore private constructor
				version = new imageClass(imageId);
			}

			images[imageClassName].push({ version, isDeprecated });
		}
	}

	return images;
};
