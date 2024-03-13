import {
	CodeBuildClient,
	type EnvironmentLanguage,
	ListCuratedEnvironmentImagesCommand,
} from "@aws-sdk/client-codebuild";
import { Architecture } from "@aws-sdk/client-lambda";
import { groupBy, mapValues } from "lodash";
import type { Entries } from "type-fest";
import { CONSOLE_SYMBOLS } from "../util";
import {
	type BuildImageClass,
	getCDKCodeBuildImages,
} from "../util/provider/codebuild";

// FIXME remove, use CodeBuild.PlatformType
enum PlatformType {
	AMAZON_LINUX = "AMAZON_LINUX",
	AMAZON_LINUX_2 = "AMAZON_LINUX_2",
	UBUNTU = "UBUNTU",
	WINDOWS_SERVER_2019 = "WINDOWS_SERVER_2019",
	WINDOWS_SERVER_2022 = "WINDOWS_SERVER_2022",
}

// FIXME remove, use CodeBuild.LanguageType
enum LanguageType {
	BASE = "BASE",
	DOTNET = "DOTNET",
	GOLANG = "GOLANG",
	JAVA = "JAVA",
	NODE_JS = "NODE_JS",
	PYTHON = "PYTHON",
	RUBY = "RUBY",
	STANDARD = "STANDARD",
}

export const MISSING_LANGUAGE_NAME = "__MISSING_LANGUAGE_NAME__";
export const MISSING_IMAGE_NAME = "__MISSING_IMAGE_NAME__";

const getFlatImageIds = (languages: EnvironmentLanguage[]) =>
	languages
		.flatMap(({ images = [] }) => images)
		.map(({ name = MISSING_IMAGE_NAME }) => name);

const getLanguageMappedImageIds = (languages: EnvironmentLanguage[]) =>
	Object.fromEntries(
		languages.map(({ language = MISSING_LANGUAGE_NAME, images = [] }) => [
			language,
			images.map(({ name = MISSING_IMAGE_NAME }) => name),
		]),
	) as Record<LanguageType, string[]>;

const getArchitectureFromImageId = (imageId: string) => {
	if (imageId.includes("-aarch64")) return Architecture.arm64;
	return Architecture.x86_64;
};

const getPlatformMappedImageIds = (languages: EnvironmentLanguage[]) =>
	mapValues(
		groupBy(
			languages
				.flatMap(({ images = [] }) => images)
				.map(({ name = MISSING_IMAGE_NAME }) => [
					getArchitectureFromImageId(name),
					name,
				]),
			([architecture]) => architecture,
		),
		(values) => values.map(([, image]) => image),
	) as Record<Architecture, string[]>;

const client = new CodeBuildClient({});
export const getBuildImages = async () => {
	const { platforms = [] } = await client.send(
		new ListCuratedEnvironmentImagesCommand({}),
	);

	const images: { [image in BuildImageClass]: string[] } = {
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
				images.WindowsBuildImage.push(...getFlatImageIds(languages));
				break;
			case PlatformType.UBUNTU:
				images.LinuxBuildImage.push(...getFlatImageIds(languages));
				break;
			case PlatformType.AMAZON_LINUX_2: {
				const mappedImages = getPlatformMappedImageIds(languages);
				images.LinuxLambdaBuildImage.push(...mappedImages[Architecture.x86_64]);
				images.LinuxArmBuildImage.push(...mappedImages[Architecture.arm64]);
				break;
			}
			// Not supported by the CDK
			case PlatformType.AMAZON_LINUX:
				break;
			default:
				throw new Error(`Unknown platform: ${platform}`);
		}
	}

	return images;
};

const runBuildImages = async () => {
	const sdkImageMap = await getBuildImages();
	const cdkImageMap = getCDKCodeBuildImages();

	for (const [imageClassName, cdkImages] of Object.entries(
		cdkImageMap,
	) as Entries<typeof cdkImageMap>) {
		const sdkImages = sdkImageMap[imageClassName];

		for (const cdkImage of cdkImages) {
			const sdkImage = sdkImages.find(
				(image) => image === cdkImage.image.imageId,
			);

			if (!sdkImage) {
				console.log(
					CONSOLE_SYMBOLS.UPDATE,
					`${imageClassName}.${cdkImage.image.imageId}`,
					"@deprecated",
				);
			}
		}

		for (const sdkImage of sdkImages) {
			const cdkImage = cdkImages.find(
				({ image: { imageId } }) => imageId === sdkImage,
			);

			if (!cdkImage) {
				console.log(CONSOLE_SYMBOLS.ADD, `${imageClassName}.${sdkImage}`);
			}
		}
	}

	/* for (const [imageClassName, cdkImages] of Object.entries(
		cdkImageMap,
	) as Entries<typeof cdkImageMap>) {
	} */
};

if (process.env.NODE_ENV !== "test") void runBuildImages();
