import { ECRClient, paginateListImages } from "@aws-sdk/client-ecr";
import { EKSClient, paginateDescribeAddonVersions } from "@aws-sdk/client-eks";
import { CONSOLE_SYMBOLS } from "../util";
import { getCDKEKSAlbControllerVersions } from "../util/provider/eks";

const eksClient = new EKSClient();
const ecrClient = new ECRClient();

const repositoryName = "amazon/aws-load-balancer-controller";
const registryId = "602401143452";

export const MISSING_IMAGE_TAG = "__MISSING_IMAGE_TAG__";

const getAlbControllerVersions = async () => {
	const versions: string[] = [];

	const paginator = paginateListImages(
		{ client: ecrClient, pageSize: 100 },
		{ repositoryName, registryId },
	);

	for await (const { imageIds = [] } of paginator) {
		versions.push(
			...imageIds.map(({ imageTag = MISSING_IMAGE_TAG }) => imageTag),
		);
	}

	return versions;
};

const runAlbController = async () => {
	const sdkVersions = await getAlbControllerVersions();
	const cdkVersions = getCDKEKSAlbControllerVersions();

	for (const cdkVersion of cdkVersions) {
		const sdkVersion = sdkVersions.find(
			(version) => version === cdkVersion.engineVersion.version,
		);

		if (!sdkVersion) {
			console.log(CONSOLE_SYMBOLS.DELETE, cdkVersion.engineVersion.version);
		}
	}

	for (const sdkVersion of sdkVersions) {
		if (sdkVersion.includes("-test")) continue;
		const cdkVersion = cdkVersions.find(
			({ engineVersion: { version } }) => version === sdkVersion,
		);

		if (!cdkVersion) {
			console.log(CONSOLE_SYMBOLS.ADD, sdkVersion);
		}
	}
};

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

// console.log(KubernetesVersion);

if (process.env.NODE_ENV !== "test") void runAlbController();
