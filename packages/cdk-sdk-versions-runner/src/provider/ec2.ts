import {
	EC2Client,
	paginateDescribeImages,
	paginateDescribeInstanceTypes,
	type Image,
	type InstanceTypeInfo,
} from "@aws-sdk/client-ec2";
import type {
	InstanceClass,
	InstanceSize,
	WindowsVersion,
} from "aws-cdk-lib/aws-ec2";
import { capitalize } from "lodash";
import { CdkSdkVersionRunner, type DeprecableVersion } from "../runner";
import {
	getCDKInstanceClasses,
	getCDKInstanceSizes,
	getCDKWindowsVersions,
} from "../util/provider/ec2";

export const __MISSING_IMAGE_NAME__ = "__MISSING_IMAGE_NAME__";

const client = new EC2Client({});
export class Ec2WindowsImagesRunner extends CdkSdkVersionRunner<
	WindowsVersion,
	Image
> {
	constructor() {
		super("Ec2WindowsImages");
	}

	protected async generateCdkVersions() {
		return getCDKWindowsVersions();
	}

	protected async fetchSdkVersions() {
		const images: Image[] = [];
		const imageNames = new Set<string>();

		const paginator = paginateDescribeImages(
			{ client, pageSize: 100 },
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
		return Name ?? __MISSING_IMAGE_NAME__;
	}

	// TODO
	private getWindowsVersionEnumKey = (windowsVersion: string) =>
		windowsVersion.toLocaleUpperCase().replace(/[-.]/g, "_");
}

class Ec2InstanceTypeRunner<
	InstanceType extends InstanceClass | InstanceSize,
> extends CdkSdkVersionRunner<InstanceType, InstanceType> {
	constructor(private readonly type: "instanceClass" | "instanceSize") {
		super(`Ec2${capitalize(type)}`);
	}

	protected static fetchInstanceTypeInfoPromise: Promise<InstanceTypeInfo[]>;
	private async fetchInstanceTypeInfo() {
		const instanceTypes: InstanceTypeInfo[] = [];
		const paginator = paginateDescribeInstanceTypes(
			{ client, pageSize: 100 },
			{},
		);
		for await (const { InstanceTypes = [] } of paginator) {
			instanceTypes.push(...InstanceTypes);
		}

		return instanceTypes;
	}

	private static getInstanceComponentsFromTypeInfo({
		InstanceType,
	}: InstanceTypeInfo) {
		const components = (InstanceType ?? "").split(".");
		if (components.length !== 2) {
			throw new Error(
				`Cannot parse instance class and size for type ${InstanceType}`,
			);
		}

		const [instanceClass, instanceSize] = components;

		return { instanceClass, instanceSize };
	}

	protected async fetchSdkVersions() {
		if (!Ec2InstanceTypeRunner.fetchInstanceTypeInfoPromise) {
			Ec2InstanceTypeRunner.fetchInstanceTypeInfoPromise =
				this.fetchInstanceTypeInfo();
		}

		const instanceTypes =
			await Ec2InstanceTypeRunner.fetchInstanceTypeInfoPromise;

		const instanceVersions = new Set<InstanceType>();
		for (const instanceType of instanceTypes) {
			instanceVersions.add(
				Ec2InstanceTypeRunner.getInstanceComponentsFromTypeInfo(instanceType)[
					this.type
				] as InstanceType,
			);
		}

		return Array.from(instanceVersions).map((version) => ({
			version,
			isDeprecated: false,
		}));
	}

	protected async generateCdkVersions() {
		return (
			this.type === "instanceClass"
				? getCDKInstanceClasses
				: getCDKInstanceSizes
		)() as DeprecableVersion<InstanceType>[];
	}

	protected getCdkVersionId(version: InstanceType) {
		return version;
	}

	protected getSdkVersionId(version: InstanceType) {
		return version;
	}
}

export class Ec2InstanceClassRunner extends Ec2InstanceTypeRunner<InstanceClass> {
	constructor() {
		super("instanceClass");
	}
}

export class Ec2InstanceSizeRunner extends Ec2InstanceTypeRunner<InstanceSize> {
	constructor() {
		super("instanceSize");
	}
}
