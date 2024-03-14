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
import { CdkSdkVersionRunner } from "../runner";
import { CONSOLE_SYMBOLS } from "../util";
import {
	InstanceClassIgnoredValues,
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

class Ec2InstanceTypeRunner extends CdkSdkVersionRunner<
	InstanceClass | InstanceSize,
	InstanceTypeInfo
> {}

export const getInstanceComponentsFromTypeInfo = ({
	InstanceType,
}: InstanceTypeInfo) => {
	const components = (InstanceType ?? "").split(".");
	if (components.length !== 2) {
		throw new Error(
			`Cannot parse instance class and size for type ${InstanceType}`,
		);
	}

	const [instanceClass, instanceSize] = components;

	return { instanceClass, instanceSize };
};

export const getInstanceTypeInfo = async () => {
	const instanceTypes: InstanceTypeInfo[] = [];
	const paginator = paginateDescribeInstanceTypes(
		{ client, pageSize: 100 },
		{},
	);
	for await (const { InstanceTypes = [] } of paginator) {
		instanceTypes.push(...InstanceTypes);
	}

	return instanceTypes;
};

export const getInstanceClasses = (instanceTypes: InstanceTypeInfo[]) => {
	const instanceClasses = new Set<InstanceClass>();
	for (const instanceType of instanceTypes) {
		instanceClasses.add(
			getInstanceComponentsFromTypeInfo(instanceType)
				.instanceClass as InstanceClass,
		);
	}

	return Array.from(instanceClasses);
};

export const getInstanceSizes = (instanceTypes: InstanceTypeInfo[]) => {
	const instanceSizes = new Set<InstanceSize>();
	for (const instanceType of instanceTypes) {
		instanceSizes.add(
			getInstanceComponentsFromTypeInfo(instanceType)
				.instanceSize as InstanceSize,
		);
	}

	return Array.from(instanceSizes);
};

const runInstanceClasses = async () => {
	const sdkInstanceClasses = getInstanceClasses(await getInstanceTypeInfo());
	const cdkInstanceClasses = getCDKInstanceClasses();

	for (const cdkInstanceClass of cdkInstanceClasses) {
		// Instance classes do not get deprecated, they should never "disappear"
		// If a class is missing, it's likely it needs to be added to
		// InstanceClassSymbolicValues or InstanceClassIgnoredValues
		if (!sdkInstanceClasses.includes(cdkInstanceClass)) {
			console.log(CONSOLE_SYMBOLS.WARNING, cdkInstanceClass);
		}
	}

	for (const sdkInstanceClass of sdkInstanceClasses) {
		if (InstanceClassIgnoredValues.includes(sdkInstanceClass)) continue;

		if (!cdkInstanceClasses.includes(sdkInstanceClass)) {
			console.log(CONSOLE_SYMBOLS.ADD_BOX, sdkInstanceClass);
		}
	}
};

const runInstanceSizes = async () => {
	const sdkInstanceSizes = getInstanceSizes(await getInstanceTypeInfo());
	const cdkInstanceSizes = getCDKInstanceSizes();

	for (const cdkInstanceSize of cdkInstanceSizes) {
		// Instance sizes do not get deprecated, they should never "disappear"
		if (!sdkInstanceSizes.includes(cdkInstanceSize)) {
			console.log(CONSOLE_SYMBOLS.WARNING, cdkInstanceSize);
		}
	}

	for (const sdkInstanceSize of sdkInstanceSizes) {
		// if (InstanceSizeIgnoredValues.includes(sdkInstanceSize)) continue;

		if (!cdkInstanceSizes.includes(sdkInstanceSize)) {
			console.log(CONSOLE_SYMBOLS.ADD_BOX, sdkInstanceSize);
		}
	}
};

if (process.env.NODE_ENV !== "test") void runWindows();
if (process.env.NODE_ENV !== "test") void runInstanceClasses();
if (process.env.NODE_ENV !== "test") void runInstanceSizes();
