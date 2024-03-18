import {
	DescribeVpcEndpointServicesCommand,
	EC2Client,
} from "@aws-sdk/client-ec2";
import { InterfaceVpcEndpointAwsService } from "aws-cdk-lib/aws-ec2";
import {
	CdkSdkVersionRunner,
	VersionStorageType,
	type DeprecableVersion,
} from "../../runner";
import { CdkLibPath } from "../../util/cdk";
import { getStaticFieldComments } from "../../util/tsdoc";

export class Ec2VpcEndpointRunner extends CdkSdkVersionRunner<
	InterfaceVpcEndpointAwsService,
	string
> {
	private static readonly client = new EC2Client({});

	public static readonly vpcEndpointPath = new CdkLibPath(
		"aws-ec2/lib/vpc-endpoint.d.ts",
	);

	constructor() {
		super("Ec2VpcEndpoints", {
			storageType: VersionStorageType.ClassWithStaticMembers,
			className: "InterfaceVpcEndpointAwsService",
		});
	}

	protected async generateCdkVersions() {
		const VpcEndpoints: DeprecableVersion<InterfaceVpcEndpointAwsService>[] =
			[];

		for (const {
			className,
			fieldName,
			fieldValue,
			isDeprecated,
		} of getStaticFieldComments(Ec2VpcEndpointRunner.vpcEndpointPath.auto)) {
			if (className !== "InterfaceVpcEndpointAwsService") continue;

			let version: InterfaceVpcEndpointAwsService;
			if (fieldName in InterfaceVpcEndpointAwsService) {
				version =
					InterfaceVpcEndpointAwsService[
						fieldName as keyof typeof InterfaceVpcEndpointAwsService
					];
			} else {
				console.warn(
					`Unknown version: ${fieldName}, replacing with new InterfaceVpcEndpointAwsService("${fieldValue}")`,
				);
				version = new InterfaceVpcEndpointAwsService(fieldValue);
			}

			VpcEndpoints.push({ version, isDeprecated });
		}

		return VpcEndpoints;
	}

	protected async fetchSdkVersions() {
		const serviceNames = new Set<string>();

		let nextToken: string | undefined;
		do {
			const { ServiceNames = [], NextToken } =
				await Ec2VpcEndpointRunner.client.send(
					new DescribeVpcEndpointServicesCommand({
						MaxResults: 100,
						NextToken: nextToken,
					}),
				);

			nextToken = NextToken;

			for (const serviceName of ServiceNames) {
				// FIXME
				if (!serviceName.startsWith("com.amazonaws.us-east-1.")) continue;
				serviceNames.add(
					serviceName.replace(/^com\.amazonaws\.us-east-1\./, ""),
				);
			}
		} while (nextToken);

		// FIXME https://github.com/aws/aws-sdk-js/issues/4614
		/* const paginator = paginateDescribeVpcEndpointServices(
			{ client: Ec2VpcEndpointRunner.client, pageSize: 100 },
			{},
		);*/

		return Array.from(serviceNames).map((version) => ({
			version,
			isDeprecated: false,
		}));
	}

	protected getCdkVersionId({ shortName }: InterfaceVpcEndpointAwsService) {
		return shortName;
	}

	protected getSdkVersionId(serviceName: string) {
		return serviceName;
	}
}
