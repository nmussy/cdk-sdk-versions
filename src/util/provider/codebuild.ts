import {
	IBuildImage,
	LinuxArmBuildImage,
	LinuxArmLambdaBuildImage,
	LinuxBuildImage,
	LinuxGpuBuildImage,
	LinuxLambdaBuildImage,
	WindowsBuildImage,
} from "aws-cdk-lib/aws-codebuild";
import { join } from "path";
import type { Entries } from "type-fest";
import { CdkLibPath, CdkPath } from "../cdk";
import { IStaticField, getStaticFieldComments } from "../tsdoc";

const basePath = "aws-codebuild/lib";

export const CDK_LIB_CODEBUILD_PROJECT_PATH = new CdkLibPath(
	join(basePath, "project.d.ts"),
);
export const CDK_LIB_CODEBUILD_LINUX_GPU_PATH = new CdkLibPath(
	join(basePath, "linux-gpu-build-image.ts"),
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
	| "LinuxGpuBuildImage"
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
		case "LinuxGpuBuildImage":
			return LinuxGpuBuildImage;
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
	LinuxGpuBuildImage: CDK_LIB_CODEBUILD_LINUX_GPU_PATH,
	LinuxLambdaBuildImage: CDK_LIB_CODEBUILD_LAMBDA_PATH,
	LinuxArmLambdaBuildImage: CDK_LIB_CODEBUILD_LAMBDA_ARM_PATH,
};

export interface DeprecableImage {
	image: IBuildImage;
	isDeprecated: boolean;
}

const imageConstructorRegex =
	/\w+.fromCodeBuildImageId\('(?<imageId>[\w.-]+)'\)/;

const imageFromConstructorRegex = /^\s*imageId: '(?<imageId>[\w\/.:-]+)'/m;

export const getCDKCodeBuildImages = () => {
	const images: { [image in BuildImageClass]: DeprecableImage[] } = {
		WindowsBuildImage: [],
		LinuxBuildImage: [],
		LinuxArmBuildImage: [],
		LinuxGpuBuildImage: [],
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

			let image: IBuildImage;
			if (fieldName in imageClass) {
				image = imageClass[fieldName as keyof typeof imageClass];
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

				// @ts-ignore private constructor
				image = new imageClass(imageId);
			}

			images[imageClassName].push({ image, isDeprecated });
		}
	}

	return images;
};
