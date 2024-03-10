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

export interface DeprecableInstanceType<
	T extends InstanceClass | InstanceSize,
> {
	instanceType: T;
	isDeprecated: boolean;
}

const _getCDKInstanceTypes = <T extends InstanceClass | InstanceSize>(
	_enumName: string,
) => {
	const instanceTypes: DeprecableInstanceType<T>[] = [];

	for (const {
		enumName,
		memberName,
		memberValue,
		isDeprecated,
	} of getEnumValuesComments(CDK_LIB_INSTANCE_TYPES_PATH.auto)) {
		if (enumName !== _enumName) continue;

		let instanceType: T;
		switch (enumName) {
			case "InstanceClass":
				if (memberName in InstanceClass) {
					instanceType = InstanceClass[
						memberName as keyof typeof InstanceClass
					] as T;
				} else {
					console.warn(
						`Unknown version: ${memberName}, replacing with ${memberName} = "${memberValue}`,
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
						`Unknown version: ${memberName}, replacing with ${memberName} = "${memberValue}`,
					);
					instanceType = memberValue as T & InstanceSize;
				}
				break;
			default:
				throw new Error(`Unknown enum name: ${enumName}`);
		}

		instanceTypes.push({
			instanceType,
			isDeprecated,
		});
	}

	return instanceTypes;
};

export const getCDKInstanceClasses = () =>
	_getCDKInstanceTypes<InstanceClass>("InstanceClass").map(
		({ instanceType: instanceClass, isDeprecated }) => ({
			instanceClass,
			isDeprecated,
		}),
	);
export const getCDKInstanceSizes = () =>
	_getCDKInstanceTypes<InstanceSize>("InstanceSize").map(
		({ instanceType: instanceSize, isDeprecated }) => ({
			instanceSize,
			isDeprecated,
		}),
	);
