import { Ec2InstancePropeties } from "@app/provider";
import { DescribeInstanceTypesCommand, EC2Client } from "@aws-sdk/client-ec2";
import { mockClient } from "aws-sdk-client-mock";
import "aws-sdk-client-mock-jest";

const ec2Mock = mockClient(EC2Client);
beforeEach(() => {
	ec2Mock.reset();
});

describe("SDK", () => {
	it("getWindowsSsmImages", async () => {
		ec2Mock.on(DescribeInstanceTypesCommand).resolves({
			InstanceTypes: [
				{
					InstanceType: "x1e.2xlarge",
					CurrentGeneration: true,
					FreeTierEligible: false,
					SupportedUsageClasses: ["on-demand", "spot"],
					SupportedRootDeviceTypes: ["ebs"],
					SupportedVirtualizationTypes: ["hvm"],
					BareMetal: false,
					Hypervisor: "xen",
					ProcessorInfo: {
						SupportedArchitectures: ["x86_64"],
						SustainedClockSpeedInGhz: 2.3,
						Manufacturer: "Intel",
					},
					VCpuInfo: {
						DefaultVCpus: 8,
						DefaultCores: 4,
						DefaultThreadsPerCore: 2,
						ValidCores: [1, 2, 3, 4],
						ValidThreadsPerCore: [1, 2],
					},
					MemoryInfo: { SizeInMiB: 249856 },
					InstanceStorageSupported: true,
					InstanceStorageInfo: {
						TotalSizeInGB: 240,
						Disks: [{ SizeInGB: 240, Count: 1, Type: "ssd" }],
						NvmeSupport: "unsupported",
						EncryptionSupport: "unsupported",
					},
					EbsInfo: {
						EbsOptimizedSupport: "default",
						EncryptionSupport: "supported",
						EbsOptimizedInfo: {
							BaselineBandwidthInMbps: 1000,
							BaselineThroughputInMBps: 125,
							BaselineIops: 7400,
							MaximumBandwidthInMbps: 1000,
							MaximumThroughputInMBps: 125,
							MaximumIops: 7400,
						},
						NvmeSupport: "unsupported",
					},
					NetworkInfo: {
						NetworkPerformance: "Up to 10 Gigabit",
						MaximumNetworkInterfaces: 4,
						MaximumNetworkCards: 1,
						DefaultNetworkCardIndex: 0,
						NetworkCards: [
							{
								NetworkCardIndex: 0,
								NetworkPerformance: "Up to 10 Gigabit",
								MaximumNetworkInterfaces: 4,
								BaselineBandwidthInGbps: 1.25,
								PeakBandwidthInGbps: 10,
							},
						],
						Ipv4AddressesPerInterface: 15,
						Ipv6AddressesPerInterface: 15,
						Ipv6Supported: true,
						EnaSupport: "supported",
						EfaSupported: false,
						EncryptionInTransitSupported: false,
						EnaSrdSupported: false,
					},
					PlacementGroupInfo: {
						SupportedStrategies: ["cluster", "partition", "spread"],
					},
					HibernationSupported: false,
					BurstablePerformanceSupported: false,
					DedicatedHostsSupported: true,
					AutoRecoverySupported: true,
					SupportedBootModes: ["legacy-bios"],
					NitroEnclavesSupport: "unsupported",
					NitroTpmSupport: "unsupported",
				},
				{
					InstanceType: "r7a.2xlarge",
					CurrentGeneration: true,
					FreeTierEligible: false,
					SupportedUsageClasses: ["on-demand", "spot"],
					SupportedRootDeviceTypes: ["ebs"],
					SupportedVirtualizationTypes: ["hvm"],
					BareMetal: false,
					Hypervisor: "nitro",
					ProcessorInfo: {
						SupportedArchitectures: ["x86_64"],
						SustainedClockSpeedInGhz: 3.7,
						Manufacturer: "AMD",
					},
					VCpuInfo: {
						DefaultVCpus: 8,
						DefaultCores: 8,
						DefaultThreadsPerCore: 1,
						ValidCores: [1, 2, 3, 4, 5, 6, 7, 8],
						ValidThreadsPerCore: [1],
					},
					MemoryInfo: { SizeInMiB: 65536 },
					InstanceStorageSupported: false,
					EbsInfo: {
						EbsOptimizedSupport: "default",
						EncryptionSupport: "supported",
						EbsOptimizedInfo: {
							BaselineBandwidthInMbps: 2500,
							BaselineThroughputInMBps: 312.5,
							BaselineIops: 12000,
							MaximumBandwidthInMbps: 10000,
							MaximumThroughputInMBps: 1250,
							MaximumIops: 40000,
						},
						NvmeSupport: "required",
					},
					NetworkInfo: {
						NetworkPerformance: "Up to 12.5 Gigabit",
						MaximumNetworkInterfaces: 4,
						MaximumNetworkCards: 1,
						DefaultNetworkCardIndex: 0,
						NetworkCards: [
							{
								NetworkCardIndex: 0,
								NetworkPerformance: "Up to 12.5 Gigabit",
								MaximumNetworkInterfaces: 4,
								BaselineBandwidthInGbps: 3.125,
								PeakBandwidthInGbps: 12.5,
							},
						],
						Ipv4AddressesPerInterface: 15,
						Ipv6AddressesPerInterface: 15,
						Ipv6Supported: true,
						EnaSupport: "required",
						EfaSupported: false,
						EncryptionInTransitSupported: true,
						EnaSrdSupported: false,
					},
					PlacementGroupInfo: {
						SupportedStrategies: ["cluster", "partition", "spread"],
					},
					HibernationSupported: true,
					BurstablePerformanceSupported: false,
					DedicatedHostsSupported: true,
					AutoRecoverySupported: true,
					SupportedBootModes: ["legacy-bios", "uefi"],
					NitroEnclavesSupport: "unsupported",
					NitroTpmSupport: "supported",
					NitroTpmInfo: { SupportedVersions: ["2.0"] },
				},
			],
		});

		const runner = new Ec2InstancePropeties();
		const images = await runner.fetchInstanceTypeInfo();
		expect(ec2Mock).toHaveReceivedCommandTimes(DescribeInstanceTypesCommand, 1);

		expect(images).toHaveLength(2);

		const [first, second] = images;
		expect(first.InstanceType).toMatch("x1e.2xlarge");
		expect(second.InstanceType).toMatch("r7a.2xlarge");
	});
});
