import {
	EC2Client,
	Image,
	InstanceTypeInfo,
	paginateDescribeImages,
	paginateDescribeInstanceTypes,
} from "@aws-sdk/client-ec2";
import {
	InstanceClass,
	InstanceSize,
	WindowsVersion,
} from "aws-cdk-lib/aws-ec2";

const client = new EC2Client({});
export const getWindowsSsmImages = async () => {
	const images: Image[] = [];
	const paginator = paginateDescribeImages(
		{ client, pageSize: 100 },
		{
			Owners: ["amazon"],
			Filters: [{ Name: "name", Values: ["Windows_Server*"] }],
		},
	);
	for await (const { Images = [] } of paginator) {
		images.push(...Images);
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
	const instanceClasses = new Set<string>();
	for (const instanceType of instanceTypes) {
		instanceClasses.add(
			getInstanceComponentsFromTypeInfo(instanceType).instanceClass,
		);
	}

	return Array.from(instanceClasses);
};

export const getInstanceSizes = (instanceTypes: InstanceTypeInfo[]) => {
	const instanceSizes = new Set<string>();
	for (const instanceType of instanceTypes) {
		instanceSizes.add(
			getInstanceComponentsFromTypeInfo(instanceType).instanceSize,
		);
	}

	return Array.from(instanceSizes);
};

const runWindowsSsmImages = async () => {
	const images = await getWindowsSsmImages();

	for (const image of images) {
		if (!image.Name) throw new Error("Image name is missing");

		if (image.State !== "available") {
			console.warn("Image is not available", image.Name);
			continue;
		}

		if (!(image.Name in WindowsVersion)) {
			console.log("missing version", image.Name);
		}
	}
};

const runInstanceType = async () => {
	const instanceTypes = await getInstanceTypeInfo();

	for (const instanceClass of getInstanceClasses(instanceTypes)) {
		if (!(instanceClass.toLocaleUpperCase() in InstanceClass))
			console.log("missing class", instanceClass);
	}

	for (const instanceSize of getInstanceSizes(instanceTypes)) {
		if (!(instanceSize.toLocaleUpperCase() in InstanceSize))
			console.log("missing size", instanceSize);
	}
};

// if (process.env.NODE_ENV !== "test") void runWindowsSsmImages();
// if (process.env.NODE_ENV !== "test") void runInstanceType();
