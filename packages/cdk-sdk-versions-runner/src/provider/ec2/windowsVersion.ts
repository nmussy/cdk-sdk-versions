import {
	EC2Client,
	paginateDescribeImages,
	type Image,
} from "@aws-sdk/client-ec2";
import {
	SSMClient,
	paginateGetParametersByPath,
	type Parameter,
} from "@aws-sdk/client-ssm";
import { WindowsVersion } from "aws-cdk-lib/aws-ec2";
import { capitalize } from "lodash";
import {
	CdkSdkVersionRunner,
	VersionStorageType,
	type DeprecableVersion,
} from "../../runner";
import { CdkLibPath } from "../../util/cdk";
import { getEnumValuesComments } from "../../util/tsdoc";

// FIXME remove once merged in CDK
enum WindowsSpecificVersion {
	/** 2024.01.16 version of {@link WindowsVersion.WINDOWS_SERVER_2022_TURKISH_FULL_BASE} */
	WINDOWS_SERVER_2022_TURKISH_FULL_BASE_2024_01_16 = "Windows_Server-2022-Turkish-Full-Base-2024.01.16",
	/** 2024.02.14 version of {@link WindowsVersion.WINDOWS_SERVER_2022_TURKISH_FULL_BASE} */
	WINDOWS_SERVER_2022_TURKISH_FULL_BASE_2024_02_14 = "Windows_Server-2022-Turkish-Full-Base-2024.02.14",
}
export type WindowsVersionUnion = WindowsVersion | WindowsSpecificVersion;

type WindowsVersionRunnerType = "windowsVersion" | "windowsSpecificVersion";

abstract class _Ec2WindowsVersionRunner<
	T extends WindowsVersionUnion,
	TSdk,
> extends CdkSdkVersionRunner<T, TSdk> {
	public static readonly windowsVersionsPath = new CdkLibPath(
		"aws-ec2/lib/windows-versions.d.ts",
	);

	public static readonly __MISSING_IMAGE_NAME__ = "__MISSING_IMAGE_NAME__";

	constructor(private readonly type: WindowsVersionRunnerType) {
		const capitalizedType = capitalize(type);
		super(`Ec2${capitalizedType}`, {
			storageType: VersionStorageType.Enum,
			enumName: capitalizedType,
		});
	}

	protected get isCacheEnabled() {
		return true;
	}

	protected static getCDKVersionsPromise: Promise<
		DeprecableVersion<WindowsVersionUnion>[]
	>;
	private async _getCDKVersions() {
		const windowsVersions: DeprecableVersion<WindowsVersionUnion>[] = [];

		for (const {
			enumName,
			memberName,
			memberValue,
			isDeprecated,
		} of getEnumValuesComments(
			_Ec2WindowsVersionRunner.windowsVersionsPath.auto,
		)) {
			let version: T;

			switch (enumName) {
				case "WindowsVersion":
					if (memberName in WindowsVersion) {
						version = WindowsVersion[
							memberName as keyof typeof WindowsVersion
						] as T;
					} else {
						version = memberValue as T & WindowsVersion;
					}
					break;
				case "WindowsSpecificVersion":
					if (memberName in WindowsSpecificVersion) {
						version = WindowsSpecificVersion[
							memberName as keyof typeof WindowsSpecificVersion
						] as T;
					} else {
						version = memberValue as T & WindowsSpecificVersion;
					}
					break;
				default:
					throw new Error(`Unknown enum name: ${enumName}`);
			}

			windowsVersions.push({ version, isDeprecated });
		}

		return windowsVersions;
	}

	protected async generateCdkVersions<T extends WindowsVersionUnion>() {
		if (
			!_Ec2WindowsVersionRunner.getCDKVersionsPromise &&
			this.isCacheEnabled
		) {
			_Ec2WindowsVersionRunner.getCDKVersionsPromise = this._getCDKVersions();
		}

		const windowsVersions =
			await _Ec2WindowsVersionRunner.getCDKVersionsPromise;

		// FIXME store and filter by enumName
		if (this.type === "windowsVersion")
			return windowsVersions.filter(
				({ version }) => !version.match(/\d{4}\.\d{2}\.\d{2}$/),
			) as DeprecableVersion<T>[];
		if (this.type === "windowsSpecificVersion")
			return windowsVersions.filter(({ version }) =>
				version.match(/\d{4}\.\d{2}\.\d{2}$/),
			) as DeprecableVersion<T>[];

		throw new Error(`Unknown instance type: ${this.type}`);
	}

	protected static fetchDescribeImagesPromise: Promise<
		DeprecableVersion<Image>[]
	>;

	protected getCdkVersionId(version: T) {
		return version as string;
	}

	// TODO
	private getWindowsVersionEnumKey = (windowsVersion: string) =>
		windowsVersion.toLocaleUpperCase().replace(/[-.]/g, "_");
}

export class Ec2WindowsVersionRunner extends _Ec2WindowsVersionRunner<
	WindowsVersion,
	Parameter
> {
	private static readonly client = new SSMClient({});
	constructor() {
		super("windowsVersion");
	}

	protected async fetchSdkVersions() {
		const parameters: Parameter[] = [];
		const parameterNames = new Set<string>();

		const paginator = paginateGetParametersByPath(
			{ client: Ec2WindowsVersionRunner.client, pageSize: 10 },
			{
				Path: "/aws/service/ami-windows-latest",
			},
		);

		for await (const { Parameters = [] } of paginator) {
			for (const parameter of Parameters) {
				if (!parameter.Name) continue;

				if (!parameterNames.has(parameter.Name)) {
					parameterNames.add(parameter.Name);
					parameters.push(parameter);
				}
			}
		}

		return parameters
			.filter(({ Name = _Ec2WindowsVersionRunner.__MISSING_IMAGE_NAME__ }) =>
				Name.startsWith("/aws/service/ami-windows-latest/Windows_Server"),
			)
			.map((version) => ({
				...version,
				Name: version.Name?.replace(
					/^\/aws\/service\/ami-windows-latest\//,
					"",
				),
			}))
			.map((version) => ({ version, isDeprecated: false }));
	}

	protected getSdkVersionId({
		Name = _Ec2WindowsVersionRunner.__MISSING_IMAGE_NAME__,
	}: Parameter) {
		return Name;
	}
}

export class Ec2WindowsSpecificVersionRunner extends _Ec2WindowsVersionRunner<
	WindowsVersion,
	Image
> {
	private static readonly client = new EC2Client({});

	constructor() {
		super("windowsSpecificVersion");
	}

	protected async fetchSdkVersions() {
		const images: Image[] = [];
		const imageNames = new Set<string>();

		const paginator = paginateDescribeImages(
			{ client: Ec2WindowsSpecificVersionRunner.client, pageSize: 100 },
			{
				Owners: ["amazon"],
				Filters: [{ Name: "name", Values: ["Windows_Server*"] }],
			},
		);

		for await (const { Images = [] } of paginator) {
			for (const image of Images) {
				if (!image.Name) continue;

				if (!imageNames.has(image.Name)) {
					imageNames.add(image.Name);
					images.push(image);
				}
			}
		}

		return images.map((version) => ({ version, isDeprecated: false }));
	}

	protected getSdkVersionId({ Name }: Image) {
		return Name ?? _Ec2WindowsVersionRunner.__MISSING_IMAGE_NAME__;
	}
}
