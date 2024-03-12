import {
	CodeBuildClient,
	ListCuratedEnvironmentImagesCommand,
} from "@aws-sdk/client-codebuild";

// FIXME remove, use CodeBuild.PlatformType
const PlatformType = {
	AMAZON_LINUX: "AMAZON_LINUX",
	AMAZON_LINUX_2: "AMAZON_LINUX_2",
	UBUNTU: "UBUNTU",
	WINDOWS_SERVER_2019: "WINDOWS_SERVER_2019",
	WINDOWS_SERVER_2022: "WINDOWS_SERVER_2022",
} as const;

// FIXME remove, use CodeBuild.LanguageType
const LanguageType = {
	BASE: "BASE",
	DOTNET: "DOTNET",
	GOLANG: "GOLANG",
	JAVA: "JAVA",
	NODE_JS: "NODE_JS",
	PYTHON: "PYTHON",
	RUBY: "RUBY",
	STANDARD: "STANDARD",
} as const;

const client = new CodeBuildClient({});
export const getBuildImages = async () =>
	client.send(new ListCuratedEnvironmentImagesCommand({}));

const runBuildImages = async () => {
	const { platforms: sdkImages = [] } = await getBuildImages();
	// const cdkImageMap = getCDKCodeBuildImages();

	for (const { platform: _platform, languages = [] } of sdkImages) {
		// FIXME remove
		const platform = _platform as unknown as keyof typeof PlatformType;

		if (platform === PlatformType.AMAZON_LINUX) continue;
		// console.log("p", platform);

		for (const { language: _language, images = [] } of languages) {
			// FIXME remove
			const language = _language as unknown as keyof typeof LanguageType;

			// console.log(" - l", language);
			for (const { name } of images) {
				// console.log("   * n", name);

				switch (language) {
					case LanguageType.STANDARD:
						break;
				}

				switch (platform) {
					case PlatformType.AMAZON_LINUX_2:
						console.log("linux", name);
						break;
				}
			}
		}
	}

	/* for (const [imageClassName, cdkImages] of Object.entries(
		cdkImageMap,
	) as Entries<typeof cdkImageMap>) {
	} */
};

if (process.env.NODE_ENV !== "test") void runBuildImages();
