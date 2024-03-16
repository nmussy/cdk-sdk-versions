import {
	EC2Client,
	paginateDescribeInstanceTypes,
	type InstanceTypeInfo,
} from "@aws-sdk/client-ec2";
import { InstanceClass, InstanceSize } from "aws-cdk-lib/aws-ec2";
import { capitalize } from "lodash";
import { CdkSdkVersionRunner } from "../../runner";
import { CdkLibPath } from "../../util/cdk";
import { getEnumValuesComments } from "../../util/tsdoc";

class Ec2InstanceTypeRunner<
	T extends InstanceClass | InstanceSize,
> extends CdkSdkVersionRunner<T, T> {
	private static readonly client = new EC2Client({});

	public static readonly instanceTypesPath = new CdkLibPath(
		"aws-ec2/lib/instance-types.d.ts",
	);

	public static readonly ignoredInstanceClasses: Record<string, string> = {
		// Available in the CDK, but not returned by the SDK in us-east-1

		// Memory-intensive instances, 2nd generation with Graviton2 processors (can be used only in RDS)
		X2G: "x2g",
		// TODO request access: https://pages.awscloud.com/EC2-P4de-Preview.html
		// Parallel-processing optimized instances with local NVME drive, extended, 4th generation (in developer preview)
		P4DE: "p4de",

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
	public static readonly ignoredInstanceClassesKeys = Object.keys(
		Ec2InstanceTypeRunner.ignoredInstanceClasses,
	);

	constructor(private readonly type: "instanceClass" | "instanceSize") {
		super(`Ec2${capitalize(type)}`);
	}

	protected static fetchInstanceTypeInfoPromise: Promise<InstanceTypeInfo[]>;
	private async fetchInstanceTypeInfo() {
		const instanceTypes: InstanceTypeInfo[] = [];
		const paginator = paginateDescribeInstanceTypes(
			{ client: Ec2InstanceTypeRunner.client, pageSize: 100 },
			{},
		);
		for await (const { InstanceTypes = [] } of paginator) {
			instanceTypes.push(...InstanceTypes);
		}

		return instanceTypes;
	}

	private static getInstanceComponentsFromTypeInfo({
		InstanceType,
	}: InstanceTypeInfo) {
		const components = (InstanceType ?? "").split(".");
		if (components.length !== 2) {
			throw new Error(
				`Cannot parse instance class and size for type ${InstanceType}`,
			);
		}

		const [instanceClass, instanceSize] = components;

		return { instanceClass, instanceSize };
	}

	protected async fetchSdkVersions() {
		if (!Ec2InstanceTypeRunner.fetchInstanceTypeInfoPromise) {
			Ec2InstanceTypeRunner.fetchInstanceTypeInfoPromise =
				this.fetchInstanceTypeInfo();
		}

		const instanceTypes =
			await Ec2InstanceTypeRunner.fetchInstanceTypeInfoPromise;

		const instanceVersions = new Set<T>();
		for (const instanceType of instanceTypes) {
			instanceVersions.add(
				Ec2InstanceTypeRunner.getInstanceComponentsFromTypeInfo(instanceType)[
					this.type
				] as T,
			);
		}

		return Array.from(instanceVersions).map((version) => ({
			version,
			isDeprecated: false,
		}));
	}

	private static _getCDKInstanceTypes<T extends InstanceClass | InstanceSize>(
		_enumName: string,
	) {
		const instanceTypes: T[] = [];

		let isSymbolicValue = false;
		for (const { enumName, memberName, memberValue } of getEnumValuesComments(
			Ec2InstanceTypeRunner.instanceTypesPath.auto,
		)) {
			if (enumName !== _enumName) continue;

			if (enumName === "InstanceClass") {
				isSymbolicValue = !isSymbolicValue;
				if (isSymbolicValue) continue;
				if (
					Ec2InstanceTypeRunner.ignoredInstanceClassesKeys.includes(memberName)
				)
					continue;
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
	}

	protected async generateCdkVersions() {
		if (this.type === "instanceClass")
			return Ec2InstanceTypeRunner._getCDKInstanceTypes<T>("InstanceClass");
		if (this.type === "instanceSize")
			return Ec2InstanceTypeRunner._getCDKInstanceTypes<T>("InstanceClass");

		throw new Error(`Unknown instance type: ${this.type}`);
	}

	protected getCdkVersionId(version: T) {
		return version;
	}

	protected getSdkVersionId(version: T) {
		return version;
	}
}

export class Ec2InstanceClassRunner extends Ec2InstanceTypeRunner<InstanceClass> {
	constructor() {
		super("instanceClass");
	}
}

export class Ec2InstanceSizeRunner extends Ec2InstanceTypeRunner<InstanceSize> {
	constructor() {
		super("instanceSize");
	}
}
