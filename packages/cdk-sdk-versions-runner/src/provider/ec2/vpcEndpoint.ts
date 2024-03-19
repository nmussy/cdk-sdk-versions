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

const isInterfaceVpcEndpointAwsService = (
	endpoint: VpcEndpointType,
): endpoint is InterfaceVpcEndpointAwsService =>
	!!(endpoint as InterfaceVpcEndpointAwsService).shortName;

interface SdkVpcEndpoint {
	service: string;
	prefix?: string;
}

export class Ec2VpcEndpointRunner extends CdkSdkVersionRunner<
	VpcEndpointType,
	SdkVpcEndpoint
> {
	private static readonly client = new EC2Client({});

	public static readonly vpcEndpointPath = new CdkLibPath(
		"aws-ec2/lib/vpc-endpoint.d.ts",
	);

	private static readonly defaultVpcEndpointPrefix =
		/^com\.amazonaws\.(\w+-\w+-\d+|\${Token\[(AWS\.Region|TOKEN)\.\d+\]})./;
	private static readonly prefixVpcEndpointPrefix =
		/^^(?<prefix>[\w.]+)\.(\w+-\w+-\d+|\${Token\[(AWS\.Region|TOKEN)\.\d+\]})\.(?<service>[\w.-]+)/;
	private static readonly globalPrefixVpcEndpointPrefix =
		/^(?<prefix>com\.amazonaws)\.(?<service>[\w.-]+)/;

	private static readonly interfaceVpcEndpointConstructorRegex =
		/new InterfaceVpcEndpointAwsService\('(?<service>[\w.:-]+)'(, '(?<prefix>[\w.:-]+)')?\);/;
	private static readonly gatewayVpcEndpointConstructorRegex =
		/new GatewayVpcEndpointAwsService\('(?<service>[\w.:-]+)'(, '(?<prefix>[\w.:-]+)')?\);/;

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
					groups: { service, prefix },
				} = match;
				/* console.warn(
					`Unknown version: ${fieldName}, replacing with new ${classInit.name}("${service}", "${prefix}")`,
				); */
				version = new classInit(service, prefix);
			}

			VpcEndpoints.push({ version, isDeprecated });
		}

		return VpcEndpoints;
	}

	private static extractServiceNameAndPrefix(
		serviceName: string,
	): SdkVpcEndpoint {
		// match com.amazonaws.us-east-1.rds
		let match = serviceName.match(
			Ec2VpcEndpointRunner.defaultVpcEndpointPrefix,
		);
		if (match) {
			return { service: serviceName.substring(match[0].length) };
		}

		// match aws.sagemaker.us-east-1.notebook
		match = serviceName.match(Ec2VpcEndpointRunner.prefixVpcEndpointPrefix);
		if (match?.groups) {
			const {
				groups: { prefix, service },
			} = match;
			return { prefix, service };
		}

		// match com.amazonaws.s3-global.accesspoint
		match = serviceName.match(
			Ec2VpcEndpointRunner.globalPrefixVpcEndpointPrefix,
		);
		if (!match?.groups) {
			throw new Error(
				`Could not extract service name and prefix from ${serviceName}`,
			);
		}
		const {
			groups: { prefix, service },
		} = match;

		return { prefix, service };
	}

	protected async fetchSdkVersions() {
		const endpoints: SdkVpcEndpoint[] = [];

		// FIXME https://github.com/aws/aws-sdk-js/issues/4614
		/* const paginator = paginateDescribeVpcEndpointServices(
			{ client: Ec2VpcEndpointRunner.client, pageSize: 100 },
			{},
		);*/
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
				endpoints.push(
					Ec2VpcEndpointRunner.extractServiceNameAndPrefix(serviceName),
				);
			}
		} while (nextToken);

		return endpoints.map((version) => ({
			version,
			isDeprecated: false,
		}));
	}

	protected getCdkVersionId(endpoint: VpcEndpointType) {
		try {
			const { prefix, service } =
				Ec2VpcEndpointRunner.extractServiceNameAndPrefix(endpoint.name);

			return prefix ? `${prefix}.${service}` : service;
		} catch (err) {
			if (isInterfaceVpcEndpointAwsService(endpoint)) {
				if (["accesspoint", "notebook"].includes(endpoint.shortName)) {
					console.log(endpoint);
				}
				return endpoint.shortName;
			}

			console.error(endpoint);
			console.error(err);
			return endpoint.name;
		}
	}

	protected getSdkVersionId({ service, prefix }: SdkVpcEndpoint) {
		return prefix ? `${prefix}.${service}` : service;
	}
}

const c = new Ec2VpcEndpointRunner();
c.run().then((res) => c.consoleOutputResults(res, { oneLine: true }));
