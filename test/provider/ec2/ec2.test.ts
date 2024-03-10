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
import { join } from "path";
import {
	getInstanceClasses,
	getInstanceSizes,
	getInstanceTypeInfo,
	getWindowsSsmImages,
} from "../../../src/provider/ec2";
import {
	CDK_LIB_INSTANCE_TYPES_PATH,
	CDK_LIB_WINDOWS_VERSIONS_PATH,
	getCDKInstanceClasses,
	getCDKInstanceSizes,
	getCDKWindowsVersions,
} from "../../../src/util/provider/ec2";

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

describe("CDK", () => {
	describe("getCDKWindowsVersions", () => {
		it("should extract getCDKWindowsVersions from .ts", () => {
			const spy = jest
				.spyOn(CDK_LIB_WINDOWS_VERSIONS_PATH, "auto", "get")
				.mockReturnValue(join(__dirname, "./mocked-windows-versions.ts"));

			const cdkWindowsImages = getCDKWindowsVersions();
			expect(spy).toHaveBeenCalled();

			expect(cdkWindowsImages).toHaveLength(2);

			const [first, second] = cdkWindowsImages;
			expect(first.windowsVersion).toBe(
				WindowsVersion.WINDOWS_SERVER_2012_R2_RTM_PORTUGUESE_PORTUGAL_64BIT_BASE,
			);
			expect(first.isDeprecated).toBe(false);

			expect(second.windowsVersion).toBe(
				"Windows_Server-2012-R2_RTM-Portugese_Portugal-64Bit-Base",
			);
			expect(second.isDeprecated).toBe(true);
		});

		it("should extract getCDKWindowsVersions from .d.ts", () => {
			const spy = jest
				.spyOn(CDK_LIB_WINDOWS_VERSIONS_PATH, "auto", "get")
				.mockReturnValue(join(__dirname, "./mocked-windows-versions.d.ts"));

			const cdkWindowsImages = getCDKWindowsVersions();
			expect(spy).toHaveBeenCalled();

			expect(cdkWindowsImages).toHaveLength(2);

			const [first, second] = cdkWindowsImages;
			expect(first.windowsVersion).toBe(
				WindowsVersion.WINDOWS_SERVER_2012_R2_RTM_PORTUGUESE_PORTUGAL_64BIT_BASE,
			);
			expect(first.isDeprecated).toBe(false);

			expect(second.windowsVersion).toBe(
				"Windows_Server-2012-R2_RTM-Portugese_Portugal-64Bit-Base",
			);
			expect(second.isDeprecated).toBe(true);
		});
	});

	describe("getCDKInstanceClasses", () => {
		it("should extract getCDKInstanceClasses from .ts", () => {
			const spy = jest
				.spyOn(CDK_LIB_INSTANCE_TYPES_PATH, "auto", "get")
				.mockReturnValue(join(__dirname, "./mocked-instance-types.ts"));

			const cdkInstanceClasses = getCDKInstanceClasses();
			expect(spy).toHaveBeenCalled();

			expect(cdkInstanceClasses).toHaveLength(2);

			const [first, second] = cdkInstanceClasses;
			expect(first).toBe(InstanceClass.M3);
			expect(second).toBe(InstanceClass.M4);
		});

		it("should extract getCDKInstanceClasses from .d.ts", () => {
			const spy = jest
				.spyOn(CDK_LIB_INSTANCE_TYPES_PATH, "auto", "get")
				.mockReturnValue(join(__dirname, "./mocked-instance-types.d.ts"));

			const cdkInstanceClasses = getCDKInstanceClasses();
			expect(spy).toHaveBeenCalled();

			expect(cdkInstanceClasses).toHaveLength(2);

			const [first, second] = cdkInstanceClasses;
			expect(first).toBe(InstanceClass.M3);
			expect(second).toBe(InstanceClass.M4);
		});
	});

	describe("getCDKInstanceSizes", () => {
		it("should extract getCDKInstanceSizes from .ts", () => {
			const spy = jest
				.spyOn(CDK_LIB_INSTANCE_TYPES_PATH, "auto", "get")
				.mockReturnValue(join(__dirname, "./mocked-instance-types.ts"));

			const cdkInstanceSizes = getCDKInstanceSizes();
			expect(spy).toHaveBeenCalled();

			expect(cdkInstanceSizes).toHaveLength(2);

			const [first, second] = cdkInstanceSizes;
			expect(first).toBe(InstanceSize.NANO);
			expect(second).toBe(InstanceSize.MICRO);
		});

		it("should extract getCDKInstanceSizes from .d.ts", () => {
			const spy = jest
				.spyOn(CDK_LIB_INSTANCE_TYPES_PATH, "auto", "get")
				.mockReturnValue(join(__dirname, "./mocked-instance-types.d.ts"));

			const cdkInstanceSizes = getCDKInstanceSizes();
			expect(spy).toHaveBeenCalled();

			expect(cdkInstanceSizes).toHaveLength(2);

			const [first, second] = cdkInstanceSizes;
			expect(first).toBe(InstanceSize.NANO);
			expect(second).toBe(InstanceSize.MICRO);
		});
	});
});
