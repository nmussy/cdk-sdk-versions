import {
	InstanceClass,
	InstanceSize,
	WindowsVersion,
} from "aws-cdk-lib/aws-ec2";
import { CdkLibPath } from "../cdk";
import { getEnumValuesComments } from "../tsdoc";

export const CDK_LIB_WINDOWS_VERSIONS_PATH = new CdkLibPath(
	"aws-ec2/lib/windows-versions.d.ts",
);

export interface DeprecableWindowsVersion {
	windowsVersion: WindowsVersion;
	isDeprecated: boolean;
}

export const getCDKWindowsVersions = () => {
	const windowsVersions: DeprecableWindowsVersion[] = [];

	for (const { memberName, memberValue, isDeprecated } of getEnumValuesComments(
		CDK_LIB_WINDOWS_VERSIONS_PATH.auto,
	)) {
		let windowsVersion: WindowsVersion;
		if (memberName in WindowsVersion) {
			windowsVersion =
				WindowsVersion[memberName as keyof typeof WindowsVersion];
		} else {
			console.warn(
				`Unknown version: ${memberName}, replacing with ${memberName} = "${memberValue}`,
			);
			windowsVersion = memberValue as WindowsVersion;
		}

		windowsVersions.push({
			windowsVersion,
			isDeprecated,
		});
	}

	return windowsVersions;
};

export const CDK_LIB_INSTANCE_TYPES_PATH = new CdkLibPath(
	"aws-ec2/lib/instance-types.d.ts",
);

// FIXME
const InstanceClassSymbolic = {
	STANDARD3: "m3",
	STANDARD4: "m4",
	STANDARD5: "m5",
	STANDARD5_NVME_DRIVE: "m5d",
	STANDARD5_AMD: "m5a",
	STANDARD5_AMD_NVME_DRIVE: "m5ad",
	STANDARD5_HIGH_PERFORMANCE: "m5n",
	STANDARD5_NVME_DRIVE_HIGH_PERFORMANCE: "m5dn",
	STANDARD5_HIGH_COMPUTE: "m5zn",
	MEMORY3: "r3",
	MEMORY4: "r4",
	MEMORY5: "r5",
	MEMORY6_AMD: "r6a",
	MEMORY6_INTEL: "r6i",
	MEMORY6_INTEL_NVME_DRIVE: "r6id",
	MEMORY6_INTEL_HIGH_PERFORMANCE: "r6in",
	MEMORY6_INTEL_NVME_DRIVE_HIGH_PERFORMANCE: "r6idn",
	MEMORY5_HIGH_PERFORMANCE: "r5n",
	MEMORY5_NVME_DRIVE: "r5d",
	MEMORY5_NVME_DRIVE_HIGH_PERFORMANCE: "r5dn",
	MEMORY5_AMD: "r5a",
	MEMORY5_AMD_NVME_DRIVE: "r5ad",
	HIGH_MEMORY_3TB_1: "u-3tb1",
	HIGH_MEMORY_6TB_1: "u-6tb1",
	HIGH_MEMORY_9TB_1: "u-9tb1",
	HIGH_MEMORY_12TB_1: "u-12tb1",
	HIGH_MEMORY_18TB_1: "u-18tb1",
	HIGH_MEMORY_24TB_1: "u-24tb1",
	MEMORY5_EBS_OPTIMIZED: "r5b",
	MEMORY6_GRAVITON: "r6g",
	MEMORY6_GRAVITON2_NVME_DRIVE: "r6gd",
	MEMORY7_GRAVITON: "r7g",
	MEMORY7_GRAVITON3_NVME_DRIVE: "r7gd",
	MEMORY7_INTEL_BASE: "r7i",
	MEMORY7_INTEL: "r7iz",
	MEMORY7_AMD: "r7a",
	COMPUTE3: "c3",
	COMPUTE4: "c4",
	COMPUTE5: "c5",
	COMPUTE5_NVME_DRIVE: "c5d",
	COMPUTE5_AMD: "c5a",
	COMPUTE5_AMD_NVME_DRIVE: "c5ad",
	COMPUTE5_HIGH_PERFORMANCE: "c5n",
	COMPUTE6_INTEL: "c6i",
	COMPUTE6_INTEL_HIGH_PERFORMANCE: "c6in",
	COMPUTE6_INTEL_NVME_DRIVE: "c6id",
	COMPUTE6_AMD: "c6a",
	COMPUTE6_GRAVITON2: "c6g",
	COMPUTE6_GRAVITON2_NVME_DRIVE: "c6gd",
	COMPUTE6_GRAVITON2_HIGH_NETWORK_BANDWIDTH: "c6gn",
	COMPUTE7_GRAVITON3: "c7g",
	COMPUTE7_GRAVITON3_NVME_DRIVE: "c7gd",
	COMPUTE7_GRAVITON3_HIGH_NETWORK_BANDWIDTH: "c7gn",
	COMPUTE7_INTEL: "c7i",
	COMPUTE7_AMD: "c7a",
	STORAGE2: "d2",
	STORAGE3: "d3",
	STORAGE3_ENHANCED_NETWORK: "d3en",
	STORAGE_COMPUTE_1: "h1",
	IO3: "i3",
	IO3_DENSE_NVME_DRIVE: "i3en",
	STORAGE4_GRAVITON: "i4g",
	STORAGE4_GRAVITON_NETWORK_OPTIMIZED: "im4gn",
	STORAGE4_GRAVITON_NETWORK_STORAGE_OPTIMIZED: "is4gen",
	BURSTABLE2: "t2",
	BURSTABLE3: "t3",
	BURSTABLE3_AMD: "t3a",
	BURSTABLE4_GRAVITON: "t4g",
	MEMORY_INTENSIVE_1: "x1",
	MEMORY_INTENSIVE_1_EXTENDED: "x1e",
	MEMORY_INTENSIVE_2_GRAVITON2: "x2g",
	MEMORY_INTENSIVE_2_GRAVITON2_NVME_DRIVE: "x2gd",
	FPGA1: "f1",
	GRAPHICS3_SMALL: "g3s",
	GRAPHICS3: "g3",
	GRAPHICS4_NVME_DRIVE_HIGH_PERFORMANCE: "g4dn",
	GRAPHICS4_AMD_NVME_DRIVE: "g4ad",
	GRAPHICS5: "g5",
	GRAPHICS5_GRAVITON2: "g5g",
	PARALLEL2: "p2",
	PARALLEL3: "p3",
	PARALLEL3_NVME_DRIVE_HIGH_PERFORMANCE: "p3dn",
	PARALLEL4_NVME_DRIVE_EXTENDED: "p4de",
	PARALLEL4: "p4d",
	PARALLEL5: "p5",
	ARM1: "a1",
	STANDARD6_GRAVITON: "m6g",
	STANDARD6_INTEL: "m6i",
	STANDARD6_INTEL_NVME_DRIVE: "m6id",
	STANDARD6_INTEL_HIGH_PERFORMANCE: "m6in",
	STANDARD6_INTEL_NVME_DRIVE_HIGH_PERFORMANCE: "m6idn",
	STANDARD6_AMD: "m6a",
	STANDARD6_GRAVITON2_NVME_DRIVE: "m6gd",
	STANDARD7_GRAVITON: "m7g",
	STANDARD7_GRAVITON3_NVME_DRIVE: "m7gd",
	STANDARD7_INTEL: "m7i",
	STANDARD7_INTEL_FLEX: "m7i-flex",
	STANDARD7_AMD: "m7a",
	HIGH_COMPUTE_MEMORY1: "z1d",
	INFERENCE1: "inf1",
	INFERENCE2: "inf2",
	MACINTOSH1_INTEL: "mac1",
	MACINTOSH2_M1: "macintosh2-m1",
	MACINTOSH2_M2: "macintosh2-m2",
	MACINTOSH2_M2_PRO: "macintosh2-m2-pro",
	VIDEO_TRANSCODING1: "vt1",
	HIGH_PERFORMANCE_COMPUTING6_AMD: "hpc6a",
	HIGH_PERFORMANCE_COMPUTING6_INTEL_NVME_DRIVE: "hpc6id",
	IO4_INTEL: "i4i",
	MEMORY_INTENSIVE_2_XT_INTEL: "x2iedn",
	MEMORY_INTENSIVE_2_INTEL: "x2idn",
	MEMORY_INTENSIVE_2_XTZ_INTEL: "x2iezn",
	HIGH_PERFORMANCE_COMPUTING7_AMD: "hpc7g",
	HIGH_PERFORMANCE_COMPUTING7_GRAVITON: "hpc7a",
	DEEP_LEARNING1: "dl1",
};
const InstanceSizeSymbolicKeys = Object.keys(InstanceClassSymbolic);

const InstanceClassIgnored = {
	// Available in the CDK, but not returned by the SDK in us-east-1

	// Memory-intensive instances, 2nd generation with Graviton2 processors (can be used only in RDS)
	X2G: "x2g",
	// Parallel-processing optimized instances with local NVME drive, extended, 4th generation (in developer preview)
	P4DE: "p4de",
	// High performance computing based on AMD EPYC, 6th generation (not available in us-east-1, available in us-east-2)
	HPC6A: "hpc6a",

	// Available in the SDK, but not in the CDK

	// Burstable instances, 1st generation (previous generation)
	T1: "t1",
	// Compute optimized instances, 1st generation (previous generation)
	C1: "c1",
	// Standard instances, 1st generation (previous generation)
	M1: "m1",
	// Standard instances, 2nd generation (previous generation)
	M2: "m2",
	// I/O-optimized instances, 2nd generation (previous generation)
	I2: "i2",
};
export const InstanceClassIgnoredValues = Object.values(InstanceClassIgnored);
export const InstanceClassIgnoredKeys = Object.keys(InstanceClassIgnored);

const _getCDKInstanceTypes = <T extends InstanceClass | InstanceSize>(
	_enumName: string,
) => {
	const instanceTypes: T[] = [];

	for (const { enumName, memberName, memberValue } of getEnumValuesComments(
		CDK_LIB_INSTANCE_TYPES_PATH.auto,
	)) {
		if (enumName !== _enumName) continue;

		if (enumName === "InstanceClass") {
			if (InstanceSizeSymbolicKeys.includes(memberName)) continue;
			if (InstanceClassIgnoredKeys.includes(memberName)) continue;
		}

		let instanceType: T;
		switch (enumName) {
			case "InstanceClass":
				if (memberName in InstanceClass) {
					instanceType = InstanceClass[
						memberName as keyof typeof InstanceClass
					] as T;
				} else {
					console.warn(
						`Unknown ${enumName}: ${memberName}, replacing with ${memberName} = "${memberValue}"`,
					);
					instanceType = memberValue as T & InstanceClass;
				}
				break;
			case "InstanceSize":
				if (memberName in InstanceSize) {
					instanceType = InstanceSize[
						memberName as keyof typeof InstanceSize
					] as T;
				} else {
					console.warn(
						`Unknown ${enumName}: ${memberName}, replacing with ${memberName} = "${memberValue}"`,
					);
					instanceType = memberValue as T & InstanceSize;
				}
				break;
			default:
				throw new Error(`Unknown enum name: ${enumName}`);
		}

		instanceTypes.push(instanceType);
	}

	return instanceTypes;
};

export const getCDKInstanceClasses = () =>
	_getCDKInstanceTypes<InstanceClass>("InstanceClass");
export const getCDKInstanceSizes = () =>
	_getCDKInstanceTypes<InstanceSize>("InstanceSize");
