import {
	CodeBuildClient,
	ListCuratedEnvironmentImagesCommand,
	type EnvironmentLanguage,
} from "@aws-sdk/client-codebuild";
import { Architecture } from "@aws-sdk/client-lambda";
import {
	LinuxArmBuildImage,
	LinuxArmLambdaBuildImage,
	LinuxBuildImage,
	LinuxLambdaBuildImage,
	WindowsBuildImage,
	type IBuildImage,
} from "aws-cdk-lib/aws-codebuild";
import { groupBy, mapValues } from "lodash";
import { join } from "node:path";
import type { Entries } from "type-fest";
import { CdkSdkVersionRunner, type DeprecableVersion } from "../runner";
import { CdkLibPath, type CdkPath } from "../util/cdk";
import { getStaticFieldComments, type IStaticField } from "../util/tsdoc";

/**
 * Temporary fix, waiting for AWS to correct its typings
 * @see https://repost.aws/questions/QUZ-_XDwHzTDqyoICmpx-M_g/invalid-platform-values-for-listcuratedenvironmentimages-output
 **/
enum PlatformType {
	AMAZON_LINUX = "AMAZON_LINUX",
	AMAZON_LINUX_2 = "AMAZON_LINUX_2",
	UBUNTU = "UBUNTU",
	WINDOWS_SERVER_2019 = "WINDOWS_SERVER_2019",
	WINDOWS_SERVER_2022 = "WINDOWS_SERVER_2022",
}

export type BuildImageClass =
	| "WindowsBuildImage"
	| "LinuxBuildImage"
	| "LinuxArmBuildImage"
	// Pending https://github.com/aws/deep-learning-containers/issues/2732
	// | "LinuxGpuBuildImage"
	| "LinuxLambdaBuildImage"
	| "LinuxArmLambdaBuildImage";

type SdkBuildImageMap = { [image in BuildImageClass]: string[] };
type CdkBuildImageMap = {
	[image in BuildImageClass]: DeprecableVersion<IBuildImage>[];
};

class CodeBuildImageRunner<T extends IBuildImage> extends CdkSdkVersionRunner<
	T,
	string
> {
	private static readonly client = new CodeBuildClient({});

	public static readonly MISSING_LANGUAGE_NAME = "__MISSING_LANGUAGE_NAME__";
	public static readonly MISSING_IMAGE_NAME = "__MISSING_IMAGE_NAME__";

	private static readonly libPath = "aws-codebuild/lib";
	private static readonly projectPath = new CdkLibPath(
		join(CodeBuildImageRunner.libPath, "project.d.ts"),
	);
	private static readonly linuxArmPath = new CdkLibPath(
		join(CodeBuildImageRunner.libPath, "linux-arm-build-image.d.ts"),
	);
	private static readonly lambdaPath = new CdkLibPath(
		join(CodeBuildImageRunner.libPath, "linux-lambda-build-image.d.ts"),
	);
	private static readonly lambdaArmPath = new CdkLibPath(
		join(CodeBuildImageRunner.libPath, "linux-arm-lambda-build-image.d.ts"),
	);
	private static readonly imageBuildPath: {
		[image in BuildImageClass]: CdkPath;
	} = {
		WindowsBuildImage: CodeBuildImageRunner.projectPath,
		LinuxBuildImage: CodeBuildImageRunner.projectPath,
		LinuxArmBuildImage: CodeBuildImageRunner.linuxArmPath,
		LinuxLambdaBuildImage: CodeBuildImageRunner.lambdaPath,
		LinuxArmLambdaBuildImage: CodeBuildImageRunner.lambdaArmPath,
	};

	private static getBuildClass(imageClass: BuildImageClass) {
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
	}

	private static readonly imageFromFactoryRegex =
		/\w+.fromCodeBuildImageId\('(?<imageId>[\w.-]+)'\)/;
	private static readonly imageObjectFactoryRegex =
		/^\s*imageId: '(?<imageId>[\w\/.:-]+)'/m;

	constructor(protected readonly imageClassName: BuildImageClass) {
		super(`CodeBuild${imageClassName}`);
	}

	private static getFlatImageIds(languages: EnvironmentLanguage[]) {
		return languages
			.flatMap(({ images = [] }) => images)
			.map(({ name = CodeBuildImageRunner.MISSING_IMAGE_NAME }) => name);
	}

	private static getArchitectureFromImageId(imageId: string) {
		if (imageId.includes("-aarch64")) return Architecture.arm64;
		return Architecture.x86_64;
	}

	private static getPlatformMappedImageIds(languages: EnvironmentLanguage[]) {
		return mapValues(
			groupBy(
				languages
					.flatMap(({ images = [] }) => images)
					.map(({ name = CodeBuildImageRunner.MISSING_IMAGE_NAME }) => [
						CodeBuildImageRunner.getArchitectureFromImageId(name),
						name,
					]),
				([architecture]) => architecture,
			),
			(values) => values.map(([, image]) => image),
		) as Record<Architecture, string[]>;
	}

	private static fetchSdkBuildImagesPromise: Promise<SdkBuildImageMap>;
	private async fetchSdkBuildImages() {
		if (CodeBuildImageRunner.fetchSdkBuildImagesPromise)
			return CodeBuildImageRunner.fetchSdkBuildImagesPromise;

		const { platforms = [] } = await CodeBuildImageRunner.client.send(
			new ListCuratedEnvironmentImagesCommand({}),
		);

		const sdkBuildImages: SdkBuildImageMap = {
			WindowsBuildImage: [],
			LinuxBuildImage: [],
			LinuxArmBuildImage: [],
			LinuxLambdaBuildImage: [],
			LinuxArmLambdaBuildImage: [],
		};

		for (const { platform: _platform, languages = [] } of platforms) {
			// FIXME remove
			const platform = _platform as unknown as PlatformType;

			switch (platform) {
				case PlatformType.WINDOWS_SERVER_2019:
				case PlatformType.WINDOWS_SERVER_2022:
					sdkBuildImages.WindowsBuildImage.push(
						...CodeBuildImageRunner.getFlatImageIds(languages),
					);
					break;
				case PlatformType.UBUNTU:
					sdkBuildImages.LinuxBuildImage.push(
						...CodeBuildImageRunner.getFlatImageIds(languages),
					);
					break;
				case PlatformType.AMAZON_LINUX_2: {
					const mappedImages =
						CodeBuildImageRunner.getPlatformMappedImageIds(languages);
					sdkBuildImages.LinuxLambdaBuildImage.push(
						...mappedImages[Architecture.x86_64],
					);
					sdkBuildImages.LinuxArmBuildImage.push(
						...mappedImages[Architecture.arm64],
					);
					break;
				}
				// Not supported by the CDK
				case PlatformType.AMAZON_LINUX:
					break;
				default:
					throw new Error(`Unknown platform: ${platform}`);
			}
		}

		return sdkBuildImages;
	}

	protected async fetchSdkVersions() {
		if (!CodeBuildImageRunner.fetchSdkBuildImagesPromise)
			CodeBuildImageRunner.fetchSdkBuildImagesPromise =
				this.fetchSdkBuildImages();

		return (await CodeBuildImageRunner.fetchSdkBuildImagesPromise)[
			this.imageClassName
		].map((version) => ({ version, isDeprecated: false }));
	}

	private static async generateCdkBuildImages() {
		const images: {
			[image in BuildImageClass]: DeprecableVersion<IBuildImage>[];
		} = {
			WindowsBuildImage: [],
			LinuxBuildImage: [],
			LinuxArmBuildImage: [],
			LinuxLambdaBuildImage: [],
			LinuxArmLambdaBuildImage: [],
		};

		const staticFields: { [path: string]: IStaticField[] } = {};

		for (const [imageClassName, { auto: path }] of Object.entries(
			CodeBuildImageRunner.imageBuildPath,
		) as Entries<typeof CodeBuildImageRunner.imageBuildPath>) {
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

				const imageClass = CodeBuildImageRunner.getBuildClass(imageClassName);

				let version: IBuildImage;
				if (fieldName in imageClass) {
					version = imageClass[fieldName as keyof typeof imageClass];
				} else {
					const match =
						fieldValue.match(CodeBuildImageRunner.imageFromFactoryRegex) ??
						fieldValue.match(CodeBuildImageRunner.imageObjectFactoryRegex);

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
	}

	// FIXME inneficient, parses all image classes, should only cache required files
	private static generateCdkBuildImagesPromise: Promise<CdkBuildImageMap>;
	protected async generateCdkVersions() {
		if (!CodeBuildImageRunner.generateCdkBuildImagesPromise)
			CodeBuildImageRunner.generateCdkBuildImagesPromise =
				CodeBuildImageRunner.generateCdkBuildImages();

		return (await CodeBuildImageRunner.generateCdkBuildImagesPromise)[
			this.imageClassName
		] as DeprecableVersion<T>[];
	}

	protected getCdkVersionId({ imageId }: IBuildImage) {
		return imageId;
	}

	protected getSdkVersionId(version: string) {
		return version;
	}
}

export class WindowsBuildImageRunner extends CodeBuildImageRunner<WindowsBuildImage> {
	constructor() {
		super("WindowsBuildImage");
	}
}

export class LinuxBuildImageRunner extends CodeBuildImageRunner<LinuxBuildImage> {
	constructor() {
		super("LinuxBuildImage");
	}
}

export class LinuxArmBuildImageRunner extends CodeBuildImageRunner<LinuxArmBuildImage> {
	constructor() {
		super("LinuxArmBuildImage");
	}
}

export class LinuxLambdaBuildImageRunner extends CodeBuildImageRunner<LinuxLambdaBuildImage> {
	constructor() {
		super("LinuxLambdaBuildImage");
	}
}

export class LinuxArmLambdaBuildImageRunner extends CodeBuildImageRunner<LinuxArmLambdaBuildImage> {
	constructor() {
		super("LinuxArmLambdaBuildImage");
	}
}
