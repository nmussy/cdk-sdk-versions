import {
	DescribeVpcEndpointServicesCommand,
	EC2Client,
} from "@aws-sdk/client-ec2";
import {
	GatewayVpcEndpointAwsService,
	InterfaceVpcEndpointAwsService,
} from "aws-cdk-lib/aws-ec2";
import {
	CdkSdkVersionRunner,
	VersionStorageType,
	type DeprecableVersion,
} from "../../runner";
import { CdkLibPath } from "../../util/cdk";
import { getStaticFieldComments } from "../../util/tsdoc";

type VpcEndpointType =
	| InterfaceVpcEndpointAwsService
	| GatewayVpcEndpointAwsService;

export class Ec2VpcEndpointRunner extends CdkSdkVersionRunner<
	VpcEndpointType,
	string
> {
	private static readonly client = new EC2Client({});

	public static readonly vpcEndpointPath = new CdkLibPath(
		"aws-ec2/lib/vpc-endpoint.d.ts",
	);

	private static readonly vpcEndpointPrefix = /^com\.amazonaws\.[a-z\d-]+\./;
	private static readonly interfaceVpcEndpointConstructorRegex =
		/new InterfaceVpcEndpointAwsService\('(?<vpcEndpoint>[\w.:-]+)'\)/;
	private static readonly gatewayVpcEndpointConstructorRegex =
		/new GatewayVpcEndpointAwsService\('(?<vpcEndpoint>[\w.:-]+)'\)/;

	constructor() {
		super("Ec2VpcEndpoints", {
			storageType: VersionStorageType.ClassWithStaticMembers,
			className: "InterfaceVpcEndpointAwsService",
		});
	}

	protected async generateCdkVersions() {
		const VpcEndpoints: DeprecableVersion<VpcEndpointType>[] = [];

		for (const {
			className,
			fieldName,
			fieldValue,
			isDeprecated,
		} of getStaticFieldComments(Ec2VpcEndpointRunner.vpcEndpointPath.auto)) {
			if (
				![
					"GatewayVpcEndpointAwsService",
					"InterfaceVpcEndpointAwsService",
				].includes(className)
			)
				continue;

			let version: VpcEndpointType;
			if (fieldName in InterfaceVpcEndpointAwsService) {
				version =
					InterfaceVpcEndpointAwsService[
						fieldName as keyof typeof InterfaceVpcEndpointAwsService
					];
			} else if (fieldName in GatewayVpcEndpointAwsService) {
				version =
					GatewayVpcEndpointAwsService[
						fieldName as keyof typeof GatewayVpcEndpointAwsService
					];
			} else {
				let classInit:
					| typeof InterfaceVpcEndpointAwsService
					| typeof GatewayVpcEndpointAwsService =
					InterfaceVpcEndpointAwsService;
				let match = fieldValue.match(
					Ec2VpcEndpointRunner.interfaceVpcEndpointConstructorRegex,
				);
				if (!match?.groups) {
					match = fieldValue.match(
						Ec2VpcEndpointRunner.gatewayVpcEndpointConstructorRegex,
					);
					classInit = GatewayVpcEndpointAwsService;
				}
				if (!match?.groups) throw new Error(`Unknown modelId: ${fieldValue}`);
				const {
					groups: { vpcEndpoint },
				} = match;
				/* console.warn(
					`Unknown version: ${fieldName}, replacing with new ${classInit.name}("${vpcEndpoint}")`,
				); */
				version = new classInit(vpcEndpoint);
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
				const match = serviceName.match(Ec2VpcEndpointRunner.vpcEndpointPrefix);
				// FIXME check that nothing is missing
				if (!match) {
					console.log("didnt match", serviceName);
					continue;
				}
				serviceNames.add(serviceName.substring(match[0].length));
			}
			console.log(serviceNames);
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

	protected getCdkVersionId(vpcEndpoint: VpcEndpointType) {
		return (
			(vpcEndpoint as InterfaceVpcEndpointAwsService).shortName ??
			vpcEndpoint.name.replace(
				/^com.amazonaws.\${Token\[AWS.Region.\d+\]}./,
				"",
			)
		);
	}

	protected getSdkVersionId(serviceName: string) {
		return serviceName;
	}
}
