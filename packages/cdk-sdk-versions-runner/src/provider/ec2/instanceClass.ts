import { InstanceClass } from "aws-cdk-lib/aws-ec2";
import { VersionStorageType } from "../../runner";
import { CdkLibPath } from "../../util/cdk";
import { getEnumValuesComments } from "../../util/tsdoc";
import { Ec2InstanceTypeInfoRunner } from "./instanceTypeInfo";

export class Ec2InstanceClassRunner extends Ec2InstanceTypeInfoRunner<
	InstanceClass,
	InstanceClass
> {
	public static readonly instanceClassPath = new CdkLibPath(
		// Post refactor
		"aws-ec2/lib/instance-type/instance-class.d.ts",
		// "aws-ec2/lib/instance-types.d.ts",
	);

	protected get isCacheEnabled() {
		return true;
	}

	constructor() {
		super("Ec2InstanceClass", {
			storageType: VersionStorageType.Enum,
			enumName: "InstanceClass",
		});
	}

	protected async fetchSdkVersions() {
		if (
			!Ec2InstanceTypeInfoRunner.fetchInstanceTypeInfoPromise &&
			this.isCacheEnabled
		) {
			Ec2InstanceTypeInfoRunner.fetchInstanceTypeInfoPromise =
				this.fetchInstanceTypeInfo();
		}

		const instanceTypes = await (this.isCacheEnabled
			? Ec2InstanceTypeInfoRunner.fetchInstanceTypeInfoPromise
			: this.fetchInstanceTypeInfo());

		const instanceClasses = new Set<InstanceClass>();
		for (const instanceType of instanceTypes) {
			instanceClasses.add(
				Ec2InstanceTypeInfoRunner.getInstanceComponentsFromTypeInfo(
					instanceType,
				).instanceClass as InstanceClass,
			);
		}

		return Array.from(instanceClasses).map((version) => ({
			version,
			isDeprecated: false,
		}));
	}

	protected async generateCdkVersions() {
		const instanceClasses: InstanceClass[] = [];

		let isSymbolicValue = false;
		for (const { enumName, memberName, memberValue } of getEnumValuesComments(
			Ec2InstanceClassRunner.instanceClassPath.auto,
		)) {
			if (enumName !== "InstanceClass") continue;

			isSymbolicValue = !isSymbolicValue;
			if (isSymbolicValue) continue;
			if (
				Ec2InstanceTypeInfoRunner.ignoredInstanceClassesKeys.includes(
					memberName,
				)
			)
				continue;

			let instanceClass: InstanceClass;
			if (memberName in InstanceClass) {
				instanceClass = InstanceClass[
					memberName as keyof typeof InstanceClass
				] as InstanceClass;
			} else {
				console.warn(
					`Unknown ${enumName}: ${memberName}, replacing with ${memberName} = "${memberValue}"`,
				);
				instanceClass = memberValue as InstanceClass & InstanceClass;
			}

			instanceClasses.push(instanceClass);
		}

		return instanceClasses.map((version) => ({ version, isDeprecated: false }));
	}

	protected getCdkVersionId(version: InstanceClass) {
		return version;
	}

	protected getSdkVersionId(version: InstanceClass) {
		return version;
	}
}
