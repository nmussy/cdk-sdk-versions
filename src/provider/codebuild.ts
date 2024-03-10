import {
	CodeBuildClient,
	ListCuratedEnvironmentImagesCommand,
} from "@aws-sdk/client-codebuild";
import {
	LinuxArmBuildImage,
	LinuxArmLambdaBuildImage,
	LinuxBuildImage,
	LinuxGpuBuildImage,
	LinuxLambdaBuildImage,
	WindowsBuildImage,
} from "aws-cdk-lib/aws-codebuild";

const client = new CodeBuildClient({});
export const getBuildImages = async () =>
	client.send(new ListCuratedEnvironmentImagesCommand({}));

console.log(
	WindowsBuildImage,
	LinuxBuildImage,
	LinuxArmBuildImage,
	LinuxGpuBuildImage,
	LinuxLambdaBuildImage,
	LinuxArmLambdaBuildImage,
);
