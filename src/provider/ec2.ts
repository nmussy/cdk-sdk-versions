import {
	EC2Client,
	Image,
	InstanceTypeInfo,
	paginateDescribeImages,
	paginateDescribeInstanceTypes,
} from "@aws-sdk/client-ec2";

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

// console.log(WindowsVersion);

export const getInstanceClasses = async () => {
	const instanceClasses: InstanceTypeInfo[] = [];

	const instanceClassNames = new Set<string>();
	const paginator = paginateDescribeInstanceTypes(
		{ client, pageSize: 100 },
		{},
	);
	for await (const { InstanceTypes = [] } of paginator) {
		for (const instanceType of InstanceTypes) {
			const [instanceClass] = (instanceType.InstanceType ?? "").split(".");
			if (!instanceClass)
				throw new Error(`Cannot parse instance class for type ${instanceType}`);

			if (instanceClassNames.has(instanceClass)) continue;
			instanceClassNames.add(instanceClass);

			instanceClasses.push(instanceType);
		}
	}

	return instanceClasses;
};

// console.log(InstanceClass);
