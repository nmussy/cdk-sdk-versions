import {
	EC2Client,
	paginateDescribeInstanceTypes,
	type InstanceTypeInfo,
} from "@aws-sdk/client-ec2";

export class Ec2InstancePropeties {
	private static readonly client = new EC2Client({});

	/* private static readonly instanceTypesPath = new CdkLibPath(
		"aws-ec2/lib/instance-types.d.ts",
	); */

	public async fetchInstanceTypeInfo() {
		const instanceTypes: InstanceTypeInfo[] = [];
		const paginator = paginateDescribeInstanceTypes(
			{ client: Ec2InstancePropeties.client, pageSize: 100 },
			{},
		);
		for await (const { InstanceTypes = [] } of paginator) {
			instanceTypes.push(...InstanceTypes);
		}

		return instanceTypes;
	}
}
