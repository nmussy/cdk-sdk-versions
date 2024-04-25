import { InstanceSize } from "aws-cdk-lib/aws-ec2";
import { VersionStorageType } from "../../runner";
import { CdkLibPath } from "../../util/cdk";
import { getEnumValuesComments } from "../../util/tsdoc";
import { Ec2InstanceTypeInfoRunner } from "./instanceTypeInfo";

export class Ec2InstanceSizeRunner extends Ec2InstanceTypeInfoRunner<
	InstanceSize,
	InstanceSize
> {
	public static readonly instanceSizePath = new CdkLibPath(
		"aws-ec2/lib/instance-type/instance-size.d.ts",
	);

	protected get isCacheEnabled() {
		return true;
	}

	constructor() {
		super("Ec2InstanceSize", {
			storageType: VersionStorageType.Enum,
			enumName: "InstanceSize",
		});
	}

	protected async fetchSdkVersions() {
		if (
			!Ec2InstanceSizeRunner.fetchInstanceTypeInfoPromise &&
			this.isCacheEnabled
		) {
			Ec2InstanceSizeRunner.fetchInstanceTypeInfoPromise =
				this.fetchInstanceTypeInfo();
		}

		const instanceTypes = await (this.isCacheEnabled
			? Ec2InstanceSizeRunner.fetchInstanceTypeInfoPromise
			: this.fetchInstanceTypeInfo());

		const instanceSizes = new Set<InstanceSize>();
		for (const instanceType of instanceTypes) {
			instanceSizes.add(
				Ec2InstanceSizeRunner.getInstanceComponentsFromTypeInfo(instanceType)
					.instanceSize as InstanceSize,
			);
		}

		return Array.from(instanceSizes).map((version) => ({
			version,
			isDeprecated: false,
		}));
	}

	protected async generateCdkVersions() {
		const instanceSizes: InstanceSize[] = [];

		for (const { enumName, memberName, memberValue } of getEnumValuesComments(
			Ec2InstanceSizeRunner.instanceSizePath.auto,
		)) {
			if (enumName !== "InstanceSize") continue;

			let instanceSize: InstanceSize;
			if (memberName in InstanceSize) {
				instanceSize = InstanceSize[
					memberName as keyof typeof InstanceSize
				] as InstanceSize;
			} else {
				console.warn(
					`Unknown ${enumName}: ${memberName}, replacing with ${memberName} = "${memberValue}"`,
				);
				instanceSize = memberValue as InstanceSize;
			}

			instanceSizes.push(instanceSize);
		}

		return instanceSizes.map((version) => ({ version, isDeprecated: false }));
	}

	protected getCdkVersionId(version: InstanceSize) {
		return version;
	}

	protected getSdkVersionId(version: InstanceSize) {
		return version;
	}
}
