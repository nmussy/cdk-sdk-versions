import {
	EC2Client,
	paginateDescribeInstanceTypes,
	type InstanceTypeInfo,
} from "@aws-sdk/client-ec2";
import { CdkSdkVersionRunner } from "../../runner";

export abstract class Ec2InstanceTypeInfoRunner<
	TCdk,
	TSdk,
> extends CdkSdkVersionRunner<TCdk, TSdk> {
	private static readonly client = new EC2Client({});

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
		Ec2InstanceTypeInfoRunner.ignoredInstanceClasses,
	);

	protected static fetchInstanceTypeInfoPromise: Promise<InstanceTypeInfo[]>;
	protected async fetchInstanceTypeInfo() {
		const instanceTypes: InstanceTypeInfo[] = [];
		const paginator = paginateDescribeInstanceTypes(
			{ client: Ec2InstanceTypeInfoRunner.client, pageSize: 100 },
			{},
		);
		for await (const { InstanceTypes = [] } of paginator) {
			instanceTypes.push(...InstanceTypes);
		}

		return instanceTypes;
	}

	protected static getInstanceComponentsFromTypeInfo({
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
}
