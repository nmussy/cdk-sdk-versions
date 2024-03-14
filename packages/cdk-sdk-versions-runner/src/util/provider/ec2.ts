import {
	InstanceClass,
	InstanceSize,
	WindowsVersion,
} from "aws-cdk-lib/aws-ec2";
import type { DeprecableVersion } from "../../runner";
import { CdkLibPath } from "../cdk";
import { getEnumValuesComments } from "../tsdoc";

export const CDK_LIB_WINDOWS_VERSIONS_PATH = new CdkLibPath(
	"aws-ec2/lib/windows-versions.d.ts",
);

export const getCDKWindowsVersions = () => {
	const windowsVersions: DeprecableVersion<WindowsVersion>[] = [];

	for (const { memberName, memberValue, isDeprecated } of getEnumValuesComments(
		CDK_LIB_WINDOWS_VERSIONS_PATH.auto,
	)) {
		let version: WindowsVersion;
		if (memberName in WindowsVersion) {
			version = WindowsVersion[memberName as keyof typeof WindowsVersion];
		} else {
			console.warn(
				`Unknown version: ${memberName}, replacing with ${memberName} = "${memberValue}"`,
			);
			version = memberValue as WindowsVersion;
		}

		windowsVersions.push({
			version,
			isDeprecated,
		});
	}

	return windowsVersions;
};

export const CDK_LIB_INSTANCE_TYPES_PATH = new CdkLibPath(
	"aws-ec2/lib/instance-types.d.ts",
);

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

export const _getCDKInstanceTypes = <T extends InstanceClass | InstanceSize>(
	_enumName: string,
) => {
	const instanceTypes: T[] = [];

	let isSymbolicValue = false;
	for (const { enumName, memberName, memberValue } of getEnumValuesComments(
		CDK_LIB_INSTANCE_TYPES_PATH.auto,
	)) {
		if (enumName !== _enumName) continue;

		if (enumName === "InstanceClass") {
			isSymbolicValue = !isSymbolicValue;
			if (isSymbolicValue) continue;
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

	return instanceTypes.map((version) => ({ version, isDeprecated: false }));
};

export const getCDKInstanceClasses = () =>
	_getCDKInstanceTypes<InstanceClass>("InstanceClass");
export const getCDKInstanceSizes = () =>
	_getCDKInstanceTypes<InstanceSize>("InstanceSize");
