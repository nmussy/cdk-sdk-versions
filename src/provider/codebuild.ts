import {
	CodeBuildClient,
	ListCuratedEnvironmentImagesCommand,
} from "@aws-sdk/client-codebuild";
import { getCDKCodeBuildImages } from "../util/provider/codebuild";

const client = new CodeBuildClient({});
export const getBuildImages = async () =>
	client.send(new ListCuratedEnvironmentImagesCommand({}));

const runBuildImages = async () => {
	// const { platforms: sdkImages } = await getBuildImages();
	const cdkImages = getCDKCodeBuildImages();

	console.log(cdkImages);
};

if (process.env.NODE_ENV !== "test") void runBuildImages();
