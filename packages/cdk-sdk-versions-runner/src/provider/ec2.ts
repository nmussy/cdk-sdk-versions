import {
	EC2Client,
	paginateDescribeImages,
	paginateDescribeInstanceTypes,
	type Image,
	type InstanceTypeInfo,
} from "@aws-sdk/client-ec2";
import type { InstanceClass, InstanceSize } from "aws-cdk-lib/aws-ec2";
import { CONSOLE_SYMBOLS } from "../util";
import {
	InstanceClassIgnoredValues,
	getCDKInstanceClasses,
	getCDKInstanceSizes,
	getCDKWindowsVersions,
} from "../util/provider/ec2";

const client = new EC2Client({});
export const getWindowsSsmImages = async () => {
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

	return images;
};

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

const getWindowsVersionEnumKey = (windowsVersion: string) =>
	windowsVersion.toLocaleUpperCase().replace(/[-.]/g, "_");

const runWindows = async () => {
	const sdkImages = await getWindowsSsmImages();
	const cdkVersions = getCDKWindowsVersions();

	for (const cdkVersion of cdkVersions) {
		const sdkImage = sdkImages.find(
			({ Name = "" }) => cdkVersion.windowsVersion === Name,
		);

		const isSdkVersionDeprecated = sdkImage?.State !== "available";

		if (!sdkImage) {
			if (cdkVersion.isDeprecated) continue;

			console.log(CONSOLE_SYMBOLS.DELETE_BOX, cdkVersion.windowsVersion);
		} else if (!cdkVersion.isDeprecated && isSdkVersionDeprecated) {
			console.log(
				CONSOLE_SYMBOLS.UPDATE_BOX,
				cdkVersion.windowsVersion,
				"@deprecated",
			);
		} else if (cdkVersion.isDeprecated && !isSdkVersionDeprecated) {
			console.log(
				CONSOLE_SYMBOLS.UPDATE_BOX,
				cdkVersion.windowsVersion,
				"not @deprecated",
			);
		}
	}

	for (const sdkImage of sdkImages) {
		if (!sdkImage.Name) continue;

		const cdkVersion = cdkVersions.find(
			({ windowsVersion }) => windowsVersion === sdkImage.Name,
		);

		if (!cdkVersion) {
			const isSdkVersionDeprecated = sdkImage?.State !== "available";
			console.log(
				CONSOLE_SYMBOLS.ADD_BOX,
				sdkImage.Name,
				isSdkVersionDeprecated ? "@deprecated" : "",
			);
			console.log(
				`${getWindowsVersionEnumKey(sdkImage.Name)} = '${sdkImage.Name}',`,
			);
		}
	}
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
