import {
	ECRClient,
	paginateListImages,
	type ListImagesCommandInput,
} from "@aws-sdk/client-ecr";
import { EKSClient } from "@aws-sdk/client-eks";
import { AlbControllerVersion } from "aws-cdk-lib/aws-eks";
import type { ReadonlyDeep } from "type-fest";
import { CdkSdkVersionRunner, type DeprecableVersion } from "../runner";
import { CdkLibPath } from "../util/cdk";
import { getStaticFieldComments } from "../util/tsdoc";

export class EksAlbControllerRunner extends CdkSdkVersionRunner<
	AlbControllerVersion,
	string
> {
	private static readonly eksClient = new EKSClient();
	private static readonly ecrClient = new ECRClient();

	private static repositoryInfo: ReadonlyDeep<
		Required<Pick<ListImagesCommandInput, "repositoryName" | "registryId">>
	> = {
		repositoryName: "amazon/aws-load-balancer-controller",
		registryId: "602401143452",
	};

	public static readonly albControllerPath = new CdkLibPath(
		"aws-eks/lib/alb-controller.ts",
	);

	// Ignore any image tags that don't match the v1.2.3 format
	// e.g. v2.0.0-rc5, v2.4.2-linux_amd64, v2.0.0-test-linux_amd64
	private static readonly validImageTagRegex = /^v\d+\.\d+\.\d+$/;
	private static readonly albControllerCnstructorRegex =
		/new AlbControllerVersion\('(?<versionName>[\w.-]+)', '(?<helmVersion>[\w.-]+)',false\)/;

	public static readonly __MISSING_IMAGE_TAG__ = "__MISSING_IMAGE_TAG__";

	constructor() {
		super("EksAlbController");
	}

	protected async generateCdkVersions() {
		const runtimes: DeprecableVersion<AlbControllerVersion>[] = [];

		for (const {
			className,
			fieldName,
			fieldValue,
			isDeprecated,
		} of getStaticFieldComments(
			EksAlbControllerRunner.albControllerPath.auto,
		)) {
			if (className !== "AlbControllerVersion") continue;

			let version: AlbControllerVersion;
			if (fieldName in AlbControllerVersion) {
				version = AlbControllerVersion[
					fieldName as keyof typeof AlbControllerVersion
				] as AlbControllerVersion;
			} else {
				const match = fieldValue.match(
					EksAlbControllerRunner.albControllerCnstructorRegex,
				);
				console.log(match?.groups);
				if (!match?.groups) throw new Error(`Unknown version: ${fieldValue}`);
				const {
					groups: { versionName, helmVersion },
				} = match;
				console.warn(
					`Unknown version: ${fieldName}, replacing with new AlbControllerVersion.of("${versionName}", "${helmVersion}")`,
				);
				version = AlbControllerVersion.of(versionName, helmVersion);
			}

			runtimes.push({ version, isDeprecated });
		}

		return runtimes;
	}

	protected async fetchSdkVersions() {
		const versions: string[] = [];

		const paginator = paginateListImages(
			{ client: EksAlbControllerRunner.ecrClient, pageSize: 100 },
			EksAlbControllerRunner.repositoryInfo,
		);

		for await (const { imageIds = [] } of paginator) {
			versions.push(
				...imageIds
					.map(
						({ imageTag = EksAlbControllerRunner.__MISSING_IMAGE_TAG__ }) =>
							imageTag,
					)
					.filter((imageTag) =>
						imageTag.match(EksAlbControllerRunner.validImageTagRegex),
					),
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

// Janky way to list all Kubernetes versions
// Does not detect deprecation
/* const getKubernetesVersions = async () => {
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
}; */
