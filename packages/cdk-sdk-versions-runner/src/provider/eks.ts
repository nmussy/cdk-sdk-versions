import {
	ECRClient,
	paginateListImages,
	type ListImagesCommandInput,
} from "@aws-sdk/client-ecr";
import { AlbControllerVersion } from "aws-cdk-lib/aws-eks";
import { exec as _exec } from "node:child_process";
import { promisify } from "node:util";
import type { ReadonlyDeep } from "type-fest";
import which from "which";
import {
	CdkSdkVersionRunner,
	VersionStorageType,
	type DeprecableVersion,
} from "../runner";
import { CdkLibPath } from "../util/cdk";
import { getStaticFieldComments } from "../util/tsdoc";

const exec = promisify(_exec);

type HelmSearchRepoResult = {
	name: string;
	version: string;
	app_version: string;
	description?: string;
};
type HelmSearchRepoCommandOutput = HelmSearchRepoResult[];

interface SdkAlbControllerVersion {
	version: string;
	helmVersion: string;
}

export class EksAlbControllerRunner extends CdkSdkVersionRunner<
	AlbControllerVersion,
	SdkAlbControllerVersion
> {
	// private static readonly eksClient = new EKSClient();
	private static readonly ecrClient = new ECRClient();

	private static readonly repositoryName = "aws-load-balancer-controller";
	private static readonly helmCommand =
		`helm search repo ${EksAlbControllerRunner.repositoryName} --versions --output json`;
	private static repositoryInfo: ReadonlyDeep<
		Required<Pick<ListImagesCommandInput, "repositoryName" | "registryId">>
	> = {
		repositoryName: `amazon/${EksAlbControllerRunner.repositoryName}`,
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

	public static readonly __MISSING_HELM_VERSION__ = "__MISSING_HELM_VERSION__";
	public static readonly __MISSING_IMAGE_TAG__ = "__MISSING_IMAGE_TAG__";

	constructor() {
		if (!which.sync("helm"))
			throw new Error(
				"'helm' command not found in PATH. Helm is required to fetch ALB controller versions",
			);

		super("EksAlbController", {
			storageType: VersionStorageType.ClassWithStaticMembers,
			className: "AlbControllerVersion",
			factoryMethod: "of",
			// TODO add callback to get helmVersion?
		});
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
					`Unknown version: ${fieldName}, replacing with AlbControllerVersion.of("${versionName}", "${helmVersion}")`,
				);
				version = AlbControllerVersion.of(versionName, helmVersion);
			}

			runtimes.push({ version, isDeprecated });
		}

		return runtimes;
	}

	protected async fetchSdkVersions() {
		const albVersions: string[] = [];

		const paginator = paginateListImages(
			{ client: EksAlbControllerRunner.ecrClient, pageSize: 100 },
			EksAlbControllerRunner.repositoryInfo,
		);

		for await (const { imageIds = [] } of paginator) {
			albVersions.push(
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

		const { stdout, stderr } = await exec(EksAlbControllerRunner.helmCommand);
		if (stderr) throw new Error(stderr);
		const helmVersions = JSON.parse(stdout) as HelmSearchRepoCommandOutput;

		return albVersions
			.map((version) => {
				const helmVersion =
					helmVersions.find(({ app_version }) => app_version === version)
						?.version ?? EksAlbControllerRunner.__MISSING_HELM_VERSION__;

				if (helmVersion === EksAlbControllerRunner.__MISSING_HELM_VERSION__) {
					console.warn(
						`Helm version not found for ALB controller version ${version}`,
					);
				}

				return { version, helmVersion };
			})
			.map((version) => ({ version, isDeprecated: false }));
	}

	protected getCdkVersionId({
		version,
		helmChartVersion,
	}: AlbControllerVersion) {
		return [version, helmChartVersion].join(
			CdkSdkVersionRunner.ARGUMENT_SEPARATOR,
		);
	}

	protected getSdkVersionId({ version, helmVersion }: SdkAlbControllerVersion) {
		return [version, helmVersion].join(CdkSdkVersionRunner.ARGUMENT_SEPARATOR);
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
