import {
	DescribeImagesCommand,
	DescribeInstanceTypesCommand,
	EC2Client,
} from "@aws-sdk/client-ec2";
import {
	InstanceClass,
	InstanceSize,
	WindowsVersion,
} from "aws-cdk-lib/aws-ec2";
import { mockClient } from "aws-sdk-client-mock";
import "aws-sdk-client-mock-jest";
import {
	getInstanceClasses,
	getInstanceSizes,
	getInstanceTypeInfo,
	getWindowsSsmImages,
} from "../../src/provider/ec2";

const ec2Mock = mockClient(EC2Client);
beforeEach(() => {
	ec2Mock.reset();
});

describe("SDK", () => {
	it("getWindowsSsmImages", async () => {
		ec2Mock.on(DescribeImagesCommand).resolves({
			Images: [
				{ Name: "Windows_Server-2019-English-Core-EKS_Optimized-1.23" },
				{ Name: "Windows_Server-2012_R2_RTM-English-Full-Base" },
			],
		});

		const images = await getWindowsSsmImages();
		expect(ec2Mock).toHaveReceivedCommandTimes(DescribeImagesCommand, 1);

		expect(images).toHaveLength(2);

		const [first, second] = images;
		expect(first.Name).toMatch(
			WindowsVersion.WINDOWS_SERVER_2019_ENGLISH_CORE_EKS_OPTIMIZED_1_23,
		);
		expect(second.Name).toMatch(
			WindowsVersion.WINDOWS_SERVER_2012_R2_RTM_ENGLISH_FULL_BASE,
		);
	});

	it("getInstanceClasses", async () => {
		ec2Mock.on(DescribeInstanceTypesCommand).resolves({
			InstanceTypes: [
				{ InstanceType: "t2.micro" },
				{ InstanceType: "t2.small" },
				{ InstanceType: "c5a.8xlarge" },
			],
		});

		const instanceTypes = await getInstanceTypeInfo();
		expect(ec2Mock).toHaveReceivedCommandTimes(DescribeInstanceTypesCommand, 1);

		const instanceClasses = getInstanceClasses(instanceTypes);

		expect(instanceClasses).toHaveLength(2);

		const [first, second] = instanceClasses;
		expect(first).toMatch(InstanceClass.T2);
		expect(second).toMatch(InstanceClass.C5A);
	});

	it("getInstanceSizes", async () => {
		ec2Mock.on(DescribeInstanceTypesCommand).resolves({
			InstanceTypes: [
				{ InstanceType: "t2.micro" },
				{ InstanceType: "t2.small" },
				{ InstanceType: "t3a.small" },
			],
		});

		const instanceTypes = await getInstanceTypeInfo();
		expect(ec2Mock).toHaveReceivedCommandTimes(DescribeInstanceTypesCommand, 1);

		const instanceSizes = getInstanceSizes(instanceTypes);

		expect(instanceSizes).toHaveLength(2);

		const [first, second] = instanceSizes;
		expect(first).toMatch(InstanceSize.MICRO);
		expect(second).toMatch(InstanceSize.SMALL);
	});
});
