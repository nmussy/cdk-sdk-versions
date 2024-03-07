import { EKSClient, paginateDescribeAddonVersions } from "@aws-sdk/client-eks";
import { KubernetesVersion } from "aws-cdk-lib/aws-eks";

const client = new EKSClient();
const getK8sVersions = async () => {
	const versions = new Set<string>();
	const paginator = paginateDescribeAddonVersions(
		{ client, pageSize: 100 },
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

console.log(KubernetesVersion);
