import {
	Ec2InstanceClassRunner,
	Ec2InstanceSizeRunner,
	Ec2WindowsVersionRunner,
} from "@app/provider";
import {
	DescribeImagesCommand,
	DescribeInstanceTypesCommand,
	EC2Client,
} from "@aws-sdk/client-ec2";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
	InstanceClass,
	InstanceSize,
	WindowsVersion,
} from "aws-cdk-lib/aws-ec2";
import { mockClient } from "aws-sdk-client-mock";
import "aws-sdk-client-mock-jest";
import { join } from "node:path";

const ec2Mock = mockClient(EC2Client);
beforeEach(() => {
	ec2Mock.reset();
});

class ProxyEc2WindowsVersionRunner extends Ec2WindowsVersionRunner {
	public async fetchSdkVersions() {
		return super.fetchSdkVersions();
	}
	public async generateCdkVersions() {
		return super.generateCdkVersions();
	}
}

class ProxyEc2InstanceClassRunner extends Ec2InstanceClassRunner {
	public get isCacheEnabled() {
		return false;
	}
	public async fetchSdkVersions() {
		return super.fetchSdkVersions();
	}
	public async generateCdkVersions() {
		return super.generateCdkVersions();
	}
}

class ProxyEc2InstanceSizeRunner extends Ec2InstanceSizeRunner {
	public get isCacheEnabled() {
		return false;
	}
	public async fetchSdkVersions() {
		return super.fetchSdkVersions();
	}
	public async generateCdkVersions() {
		return super.generateCdkVersions();
	}
}

describe("SDK", () => {
	it("getWindowsSsmImages", async () => {
		ec2Mock.on(DescribeImagesCommand).resolves({
			Images: [
				{ Name: "Windows_Server-2019-English-Core-EKS_Optimized-1.23" },
				{ Name: "Windows_Server-2012_R2_RTM-English-Full-Base" },
			],
		});

		const runner = new ProxyEc2WindowsVersionRunner();
		const images = await runner.fetchSdkVersions();
		expect(ec2Mock).toHaveReceivedCommandTimes(DescribeImagesCommand, 1);

		expect(images).toHaveLength(2);

		const [first, second] = images;
		expect(first.version.Name).toMatch(
			WindowsVersion.WINDOWS_SERVER_2019_ENGLISH_CORE_EKS_OPTIMIZED_1_23,
		);
		expect(second.version.Name).toMatch(
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

		const runner = new ProxyEc2InstanceClassRunner();
		const instanceClasses = await runner.fetchSdkVersions();
		expect(ec2Mock).toHaveReceivedCommandTimes(DescribeInstanceTypesCommand, 1);

		expect(instanceClasses).toHaveLength(2);

		const [first, second] = instanceClasses;
		expect(first.version).toMatch(InstanceClass.T2);
		expect(second.version).toMatch(InstanceClass.C5A);
	});

	it("getInstanceSizes", async () => {
		ec2Mock.on(DescribeInstanceTypesCommand).resolves({
			InstanceTypes: [
				{ InstanceType: "t2.micro" },
				{ InstanceType: "t2.small" },
				{ InstanceType: "t3a.small" },
			],
		});

		const runner = new ProxyEc2InstanceSizeRunner();
		const instanceSizes = await runner.fetchSdkVersions();
		expect(ec2Mock).toHaveReceivedCommandTimes(DescribeInstanceTypesCommand, 1);

		expect(instanceSizes).toHaveLength(2);

		const [first, second] = instanceSizes;
		expect(first.version).toMatch(InstanceSize.MICRO);
		expect(second.version).toMatch(InstanceSize.SMALL);
	});
});

describe("CDK", () => {
	describe("getCDKWindowsVersions", () => {
		it("should extract getCDKWindowsVersions from .ts", async () => {
			const spy = jest
				.spyOn(ProxyEc2WindowsVersionRunner.windowsVersionsPath, "auto", "get")
				.mockReturnValue(join(__dirname, "./mocked-windows-versions.ts"));

			const runner = new ProxyEc2WindowsVersionRunner();
			const cdkWindowsImages = await runner.generateCdkVersions();
			expect(spy).toHaveBeenCalled();

			expect(cdkWindowsImages).toHaveLength(2);

			const [first, second] = cdkWindowsImages;
			expect(first.version).toBe(
				WindowsVersion.WINDOWS_SERVER_2012_R2_RTM_PORTUGUESE_PORTUGAL_64BIT_BASE,
			);
			expect(first.isDeprecated).toBe(false);

			expect(second.version).toBe(
				"Windows_Server-2012-R2_RTM-Portugese_Portugal-64Bit-Base",
			);
			expect(second.isDeprecated).toBe(true);
		});

		it("should extract getCDKWindowsVersions from .d.ts", async () => {
			const spy = jest
				.spyOn(ProxyEc2WindowsVersionRunner.windowsVersionsPath, "auto", "get")
				.mockReturnValue(join(__dirname, "./mocked-windows-versions.d.ts"));

			const runner = new ProxyEc2WindowsVersionRunner();
			const cdkWindowsImages = await runner.generateCdkVersions();
			expect(spy).toHaveBeenCalled();

			expect(cdkWindowsImages).toHaveLength(2);

			const [first, second] = cdkWindowsImages;
			expect(first.version).toBe(
				WindowsVersion.WINDOWS_SERVER_2012_R2_RTM_PORTUGUESE_PORTUGAL_64BIT_BASE,
			);
			expect(first.isDeprecated).toBe(false);

			expect(second.version).toBe(
				"Windows_Server-2012-R2_RTM-Portugese_Portugal-64Bit-Base",
			);
			expect(second.isDeprecated).toBe(true);
		});
	});

	describe("getCDKInstanceClasses", () => {
		it("should extract getCDKInstanceClasses from .ts", async () => {
			const spy = jest
				.spyOn(ProxyEc2InstanceClassRunner.instanceTypesPath, "auto", "get")
				.mockReturnValue(join(__dirname, "./mocked-instance-types.ts"));

			const runner = new ProxyEc2InstanceClassRunner();
			const cdkInstanceClasses = await runner.generateCdkVersions();
			expect(spy).toHaveBeenCalled();

			expect(cdkInstanceClasses).toHaveLength(2);

			const [first, second] = cdkInstanceClasses;
			expect(first.version).toBe(InstanceClass.M3);
			expect(second.version).toBe(InstanceClass.M4);
		});

		it("should extract getCDKInstanceClasses from .d.ts", async () => {
			const spy = jest
				.spyOn(ProxyEc2InstanceClassRunner.instanceTypesPath, "auto", "get")
				.mockReturnValue(join(__dirname, "./mocked-instance-types.d.ts"));

			const runner = new ProxyEc2InstanceClassRunner();
			const cdkInstanceClasses = await runner.generateCdkVersions();
			expect(spy).toHaveBeenCalled();

			expect(cdkInstanceClasses).toHaveLength(2);

			const [first, second] = cdkInstanceClasses;
			expect(first.version).toBe(InstanceClass.M3);
			expect(second.version).toBe(InstanceClass.M4);
		});
	});

	describe("getCDKInstanceSizes", () => {
		it("should extract getCDKInstanceSizes from .ts", async () => {
			const spy = jest
				.spyOn(ProxyEc2InstanceSizeRunner.instanceTypesPath, "auto", "get")
				.mockReturnValue(join(__dirname, "./mocked-instance-types.ts"));

			const runner = new ProxyEc2InstanceSizeRunner();
			const cdkInstanceSizes = await runner.generateCdkVersions();
			expect(spy).toHaveBeenCalled();

			expect(cdkInstanceSizes).toHaveLength(2);

			const [first, second] = cdkInstanceSizes;
			expect(first.version).toBe(InstanceSize.NANO);
			expect(second.version).toBe(InstanceSize.MICRO);
		});

		it("should extract getCDKInstanceSizes from .d.ts", async () => {
			const spy = jest
				.spyOn(ProxyEc2InstanceSizeRunner.instanceTypesPath, "auto", "get")
				.mockReturnValue(join(__dirname, "./mocked-instance-types.d.ts"));

			const runner = new ProxyEc2InstanceSizeRunner();
			const cdkInstanceSizes = await runner.generateCdkVersions();
			expect(spy).toHaveBeenCalled();

			expect(cdkInstanceSizes).toHaveLength(2);

			const [first, second] = cdkInstanceSizes;
			expect(first.version).toBe(InstanceSize.NANO);
			expect(second.version).toBe(InstanceSize.MICRO);
		});
	});
});
