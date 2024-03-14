import { ECRClient, paginateListImages } from "@aws-sdk/client-ecr";
import { EKSClient, paginateDescribeAddonVersions } from "@aws-sdk/client-eks";
import type { AlbControllerVersion } from "aws-cdk-lib/aws-eks";
import { CdkSdkVersionRunner } from "../runner";
import { getCDKEKSAlbControllerVersions } from "../util/provider/eks";

const eksClient = new EKSClient();
const ecrClient = new ECRClient();

const repositoryName = "amazon/aws-load-balancer-controller";
const registryId = "602401143452";

export const MISSING_IMAGE_TAG = "__MISSING_IMAGE_TAG__";

// Ignore any image tags that don't match the v1.2.3 format
// e.g. v2.0.0-rc5, v2.4.2-linux_amd64, v2.0.0-test-linux_amd64
const validImageTagRegex = /^v\d+\.\d+\.\d+$/;

export class EksAlbControllerRunner extends CdkSdkVersionRunner<
	AlbControllerVersion,
	string
> {
	constructor() {
		super("EksAlbController");
	}

	protected async generateCdkVersions() {
		return getCDKEKSAlbControllerVersions();
	}
	protected async fetchSdkVersions() {
		const versions: string[] = [];

		const paginator = paginateListImages(
			{ client: ecrClient, pageSize: 100 },
			{ repositoryName, registryId },
		);

		for await (const { imageIds = [] } of paginator) {
			versions.push(
				...imageIds
					.map(({ imageTag = MISSING_IMAGE_TAG }) => imageTag)
					.filter((imageTag) => imageTag.match(validImageTagRegex)),
			);
		}

		return versions.map((version) => ({ version, isDeprecated: false }));
	}

	protected getCdkVersionId({ version }: AlbControllerVersion) {
		return version;
	}

	protected getSdkVersionId(version: string) {
		return version;
	}
}

const getKubernetesVersions = async () => {
	const versions = new Set<string>();
	const paginator = paginateDescribeAddonVersions(
		{ client: eksClient, pageSize: 100 },
		{},
	);

	for await (const { addons = [] } of paginator) {
		for (const { addonVersions = [] } of addons) {
			for (const { compatibilities = [] } of addonVersions) {
				for (const { clusterVersion } of compatibilities) {
					if (clusterVersion) {
						versions.add(clusterVersion);
					}
				}
			}
		}
	}

	return Array.from(versions);
};
