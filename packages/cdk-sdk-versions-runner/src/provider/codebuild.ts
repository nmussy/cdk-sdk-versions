import {
	CodeBuildClient,
	ListCuratedEnvironmentImagesCommand,
	type EnvironmentLanguage,
} from "@aws-sdk/client-codebuild";
import { Architecture } from "@aws-sdk/client-lambda";
import type { IBuildImage } from "aws-cdk-lib/aws-codebuild";
import { groupBy, mapValues } from "lodash";
import { CdkSdkVersionRunner, type DeprecableVersion } from "../runner";
import {
	getCDKCodeBuildImages,
	type BuildImageClass,
} from "../util/provider/codebuild";

// FIXME remove, use CodeBuild.PlatformType
enum PlatformType {
	AMAZON_LINUX = "AMAZON_LINUX",
	AMAZON_LINUX_2 = "AMAZON_LINUX_2",
	UBUNTU = "UBUNTU",
	WINDOWS_SERVER_2019 = "WINDOWS_SERVER_2019",
	WINDOWS_SERVER_2022 = "WINDOWS_SERVER_2022",
}

export const MISSING_LANGUAGE_NAME = "__MISSING_LANGUAGE_NAME__";
export const MISSING_IMAGE_NAME = "__MISSING_IMAGE_NAME__";

type SdkBuildImageMap = { [image in BuildImageClass]: string[] };
type CdkBuildImageMap = {
	[image in BuildImageClass]: DeprecableVersion<IBuildImage>[];
};

const client = new CodeBuildClient({});
class CodeBuildImageRunner extends CdkSdkVersionRunner<IBuildImage, string> {
	constructor(protected readonly imageClassName: BuildImageClass) {
		super(`CodeBuild${imageClassName}`);
	}

	private static getFlatImageIds(languages: EnvironmentLanguage[]) {
		return languages
			.flatMap(({ images = [] }) => images)
			.map(({ name = MISSING_IMAGE_NAME }) => name);
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
					.map(({ name = MISSING_IMAGE_NAME }) => [
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

		const { platforms = [] } = await client.send(
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

	// FIXME inneficient, parses all image classes, should only cache required files
	private static generateCdkBuildImagesPromise: Promise<CdkBuildImageMap>;
	protected async generateCdkVersions() {
		if (!CodeBuildImageRunner.generateCdkBuildImagesPromise)
			CodeBuildImageRunner.generateCdkBuildImagesPromise = (async () =>
				getCDKCodeBuildImages())();

		return (await CodeBuildImageRunner.generateCdkBuildImagesPromise)[
			this.imageClassName
		];
	}

	protected getCdkVersionId({ imageId }: IBuildImage) {
		return imageId;
	}

	protected getSdkVersionId(version: string) {
		return version;
	}
}

export class WindowsBuildImageRunner extends CodeBuildImageRunner {
	constructor() {
		super("WindowsBuildImage");
	}
}

export class LinuxBuildImageRunner extends CodeBuildImageRunner {
	constructor() {
		super("LinuxBuildImage");
	}
}

export class LinuxArmBuildImageRunner extends CodeBuildImageRunner {
	constructor() {
		super("LinuxArmBuildImage");
	}
}

export class LinuxLambdaBuildImageRunner extends CodeBuildImageRunner {
	constructor() {
		super("LinuxLambdaBuildImage");
	}
}

export class LinuxArmLambdaBuildImageRunner extends CodeBuildImageRunner {
	constructor() {
		super("LinuxArmLambdaBuildImage");
	}
}
