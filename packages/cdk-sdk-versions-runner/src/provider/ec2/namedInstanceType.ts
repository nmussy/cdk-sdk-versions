import { InstanceClass, InstanceSize, InstanceType } from "aws-cdk-lib/aws-ec2";
import { VersionStorageType, type DeprecableVersion } from "../../runner";
import { CdkLibPath } from "../../util/cdk";
import { getStaticFieldComments } from "../../util/tsdoc";
import { Ec2InstanceTypeInfoRunner } from "./instanceTypeInfo";

export class Ec2NamedInstanceTypeRunner extends Ec2InstanceTypeInfoRunner<
	// FIXME should be NamedInstanceType, waiting for refactor to be merged
	InstanceType,
	string
> {
	public static readonly namedInstanceTypesPath = new CdkLibPath(
		// Post refactor
		"aws-ec2/lib/instance-type/named-instance-types.d.ts",
		// "aws-ec2/lib/instance-types.d.ts",
	);

	public static readonly __MISSING_TYPE_NAME__ = "__MISSING_TYPE_NAME__";

	private static readonly namedInstanceTypeConstructorRegex =
		/InstanceType.of\(InstanceClass\.(?<instanceClass>\w+),\s*InstanceSize\.(?<instanceSize>\w+)\)/;

	protected get isCacheEnabled() {
		return true;
	}

	constructor() {
		super("Ec2NamedInstanceType", {
			storageType: VersionStorageType.ClassWithStaticMembers,
			className: "NamedInstanceType",
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

		return Array.from(instanceTypes).map(
			({
				InstanceType: version = Ec2NamedInstanceTypeRunner.__MISSING_TYPE_NAME__,
			}) => ({
				version,
				isDeprecated: false,
			}),
		);
	}

	protected async generateCdkVersions() {
		const instanceTypes: DeprecableVersion<InstanceType>[] = [];

		let isSymbolicValue = false;
		for (const {
			className,
			fieldName,
			fieldValue,
			isDeprecated,
		} of getStaticFieldComments(
			Ec2NamedInstanceTypeRunner.namedInstanceTypesPath.auto,
		)) {
			if (className !== "NamedInstanceType") continue;
			isSymbolicValue = !isSymbolicValue;
			if (isSymbolicValue) continue;
			if (
				Ec2NamedInstanceTypeRunner.ignoredInstanceClassesKeys.includes(
					fieldName,
				)
			)
				continue;

			let version: InstanceType;
			if (fieldName in InstanceType) {
				version = InstanceType[
					fieldName as keyof typeof InstanceType
				] as InstanceType;
			} else {
				const match = fieldValue.match(
					Ec2NamedInstanceTypeRunner.namedInstanceTypeConstructorRegex,
				);
				if (!match?.groups) throw new Error(`Unknown version: ${fieldValue}`);
				const {
					groups: { instanceClass, instanceSize },
				} = match;
				console.warn(
					`Unknown version: ${fieldName}, replacing with InstanceType.of(InstanceClass.${instanceClass}, InstanceSize.${instanceSize})`,
				);
				version = InstanceType.of(
					InstanceClass[instanceClass as keyof typeof InstanceClass],
					InstanceSize[instanceSize as keyof typeof InstanceSize],
				);
			}

			instanceTypes.push({ version, isDeprecated });
		}

		return instanceTypes;
	}

	protected getCdkVersionId(version: InstanceType) {
		return version.toString();
	}

	protected getSdkVersionId(version: string) {
		return version;
	}
}
