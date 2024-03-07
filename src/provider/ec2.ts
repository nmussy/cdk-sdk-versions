import { EC2Client, Image, paginateDescribeImages } from "@aws-sdk/client-ec2";
import { WindowsVersion } from "aws-cdk-lib/aws-ec2";

const client = new EC2Client({});
export const getImages = async () => {
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

console.log(WindowsVersion);
