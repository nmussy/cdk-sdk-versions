import {
	EC2Client,
	paginateDescribeImages,
	type Image,
} from "@aws-sdk/client-ec2";
import { WindowsVersion } from "aws-cdk-lib/aws-ec2";
import { CdkSdkVersionRunner, type DeprecableVersion } from "../../runner";
import { CdkLibPath } from "../../util/cdk";
import { getEnumValuesComments } from "../../util/tsdoc";

export class Ec2WindowsVersionRunner extends CdkSdkVersionRunner<
	WindowsVersion,
	Image
> {
	private static readonly client = new EC2Client({});

	public static readonly windowsVersionsPath = new CdkLibPath(
		"aws-ec2/lib/windows-versions.d.ts",
	);

	public static readonly __MISSING_IMAGE_NAME__ = "__MISSING_IMAGE_NAME__";

	constructor() {
		super("Ec2WindowsImages");
	}

	protected async generateCdkVersions() {
		const windowsVersions: DeprecableVersion<WindowsVersion>[] = [];

		for (const {
			memberName,
			memberValue,
			isDeprecated,
		} of getEnumValuesComments(
			Ec2WindowsVersionRunner.windowsVersionsPath.auto,
		)) {
			let version: WindowsVersion;
			if (memberName in WindowsVersion) {
				version = WindowsVersion[memberName as keyof typeof WindowsVersion];
			} else {
				console.warn(
					`Unknown version: ${memberName}, replacing with ${memberName} = "${memberValue}"`,
				);
				version = memberValue as WindowsVersion;
			}

			windowsVersions.push({ version, isDeprecated });
		}

		return windowsVersions;
	}

	protected async fetchSdkVersions() {
		const images: Image[] = [];
		const imageNames = new Set<string>();

		const paginator = paginateDescribeImages(
			{ client: Ec2WindowsVersionRunner.client, pageSize: 100 },
			{
				Owners: ["amazon"],
				Filters: [{ Name: "name", Values: ["Windows_Server*"] }],
			},
		);

		for await (const { Images = [] } of paginator) {
			for (const image of Images) {
				if (!image.Name) continue;

				if (!imageNames.has(image.Name)) {
					imageNames.add(image.Name);
					images.push(image);
				}
			}
		}

		return images.map((version) => ({ version, isDeprecated: false }));
	}

	protected getCdkVersionId(version: WindowsVersion) {
		return version as string;
	}

	protected getSdkVersionId({ Name }: Image) {
		return Name ?? Ec2WindowsVersionRunner.__MISSING_IMAGE_NAME__;
	}

	// TODO
	private getWindowsVersionEnumKey = (windowsVersion: string) =>
		windowsVersion.toLocaleUpperCase().replace(/[-.]/g, "_");
}
