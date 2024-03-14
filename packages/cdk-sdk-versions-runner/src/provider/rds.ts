import {
	RDSClient,
	paginateDescribeDBEngineVersions,
	type DBEngineVersion,
} from "@aws-sdk/client-rds";
import {
	AuroraMysqlEngineVersion,
	AuroraPostgresEngineVersion,
	EngineVersion,
	MariaDbEngineVersion,
	MysqlEngineVersion,
	OracleEngineVersion,
	PostgresEngineVersion,
	SqlServerEngineVersion,
} from "aws-cdk-lib/aws-rds";
import { uniqBy } from "lodash";
import { CdkSdkVersionRunner } from "../runner";
import { CONSOLE_SYMBOLS } from "../util";
import {
	CdkEngineGuard,
	OracleEngines,
	RdsEngine,
	SqlServerEngines,
	getCDKClusterEngineVersions,
	getCDKInstanceEngineVersions,
	getVersionFromCdkEngineVersion,
	isEngineVersionEqualWith,
	type CdkEngineVersion,
	type CdkEngineVersionType,
	type DeprecableEngineVersion,
	type EngineKey,
} from "../util/provider/rds";

const client = new RDSClient({});

class RdsEngineRunner<
	EngineVersion extends CdkEngineVersion,
> extends CdkSdkVersionRunner<EngineVersion, EngineVersion> {
	constructor(
		protected readonly engineKey: EngineKey,
		protected readonly engineVesionType: CdkEngineVersionType,
	) {
		super(`Rds${engineKey}`);
	}

	private static fetchSdkEngineVersionPromiseMap: Partial<
		Record<EngineKey, Promise<DeprecableEngineVersion<CdkEngineVersion>[]>>
	> = {};
	private async fetchSdkEngineVersion<EngineVersion extends CdkEngineVersion>(
		engine: EngineKey,
		engiveVersionType: CdkEngineVersionType,
	): Promise<DeprecableEngineVersion<EngineVersion>[]> {
		const versions: DBEngineVersion[] = [];
		const paginator = paginateDescribeDBEngineVersions(
			{ client, pageSize: 100 },
			{
				Engine: engine,
				IncludeAll: true,
			},
		);

		for await (const { DBEngineVersions = [] } of paginator) {
			versions.push(...DBEngineVersions);
		}

		return versions.map(
			({
				EngineVersion = MISSING_ENGINE_VERSION,
				MajorEngineVersion = MISSING_MAJOR_ENGINE_VERSION,
				Status,
			}) => ({
				version: engiveVersionType.of(
					EngineVersion,
					MajorEngineVersion,
				) as EngineVersion,
				isDeprecated: Status !== "available",
			}),
		);
	}

	protected async fetchSdkVersions() {
		if (!RdsEngineRunner.fetchSdkEngineVersionPromiseMap[this.engineKey]) {
			RdsEngineRunner.fetchSdkEngineVersionPromiseMap[this.engineKey] =
				this.fetchSdkEngineVersion<EngineVersion>(
					this.engineKey,
					this.engineVesionType,
				);
		}

		return ((await RdsEngineRunner.fetchSdkEngineVersionPromiseMap[
			this.engineKey
		]) ?? []) as DeprecableEngineVersion<EngineVersion>[];
	}
}

export const getSdkRdsEngineVersions = async (engine: RdsEngine) => {
	const versions: DBEngineVersion[] = [];
	const paginator = paginateDescribeDBEngineVersions(
		{ client, pageSize: 100 },
		{
			Engine: engine,
			IncludeAll: true,
		},
	);

	for await (const { DBEngineVersions = [] } of paginator) {
		versions.push(...DBEngineVersions);
	}

	return versions;
};

export const MISSING_ENGINE_VERSION = "__MISSING_ENGINE_VERSION__";
export const MISSING_MAJOR_ENGINE_VERSION = "__MISSING_MAJOR_ENGINE_VERSION__";

const _getSdkEngineVersions = async <
	T extends CdkEngineVersionType = CdkEngineVersion,
>(
	sdkEngine: RdsEngine,
	cdkEngine: T,
) =>
	(await getSdkRdsEngineVersions(sdkEngine)).map<DeprecableEngineVersion<T>>(
		({
			EngineVersion = MISSING_ENGINE_VERSION,
			MajorEngineVersion = MISSING_MAJOR_ENGINE_VERSION,
			Status,
		}) => ({
			version: cdkEngine.of(EngineVersion, MajorEngineVersion) as unknown as T,
			isDeprecated: Status !== "available",
		}),
	);

export const getSdkOracleEngineVersions = async (engines = OracleEngines) =>
	uniqBy(
		(
			await Promise.all(
				engines.map((engine) =>
					_getSdkEngineVersions(engine, OracleEngineVersion),
				),
			)
		).flat(),
		({ engineVersion }) =>
			getVersionFromCdkEngineVersion(engineVersion).fullVersion,
	);

export const getSdkMysqlEngineVersions = async () =>
	_getSdkEngineVersions(RdsEngine.MYSQL, MysqlEngineVersion);

export const getSdkMariaDbEngineVersions = async () =>
	_getSdkEngineVersions(RdsEngine.MARIADB, MariaDbEngineVersion);

export const getSdkPostgresEngineVersions = async () =>
	_getSdkEngineVersions(RdsEngine.POSTGRES, PostgresEngineVersion);

export const getSdkAuroraMysqlEngineVersions = async () =>
	_getSdkEngineVersions(RdsEngine.AURORA_MYSQL, AuroraMysqlEngineVersion);

export const getSdkAuroraPostgresEngineVersions = async () =>
	_getSdkEngineVersions(
		RdsEngine.AURORA_POSTGRESQL,
		AuroraPostgresEngineVersion,
	);

export const getSdkSqlServerEngineVersions = async (
	engines = SqlServerEngines,
) =>
	uniqBy(
		(
			await Promise.all(
				engines.map((engine) =>
					_getSdkEngineVersions(engine, SqlServerEngineVersion),
				),
			)
		).flat(),
		({ version }) => getVersionFromCdkEngineVersion(version).fullVersion,
	);

interface RunProps {
	cdkEngines: DeprecableEngineVersion[];
	sdkEngines: DeprecableEngineVersion[];
	engineKey: EngineKey;
}

const stringifyEngineVersion = (
	{ version }: DeprecableEngineVersion,
	engineKey: EngineKey,
) =>
	`${engineKey}.${getVersionFromCdkEngineVersion(version)
		.fullVersion.toLocaleUpperCase()
		.replace(/\./g, "_")}`;

const humanName: Record<EngineKey, string> = {
	PostgresEngineVersion: "PostgreSQL",
	MysqlEngineVersion: "MySQL",
	MariaDbEngineVersion: "MariaDB",
	OracleEngineVersion: "Oracle",
	SqlServerEngineVersion: "SQL Server",

	AuroraMysqlEngineVersion: "Version",
	AuroraPostgresEngineVersion: "Version",
};

const _getStaticComment = (
	{ version, isDeprecated }: DeprecableEngineVersion,
	engineKey: EngineKey,
) => {
	const { fullVersion } = getVersionFromCdkEngineVersion(version);

	return (
		isDeprecated
			? /* ts */ `
  /**
   * Version "${fullVersion}"
   * @deprecated ${humanName[engineKey]} ${fullVersion} is no longer supported by Amazon RDS.
   */
`
			: /* ts */ `
  /** Version "${fullVersion}". */
`
	).trim();
};

const getPostgresStaticFeatures = (engineVersion: CdkEngineVersion) => {
	const { fullVersion } = getVersionFromCdkEngineVersion(engineVersion);

	const [majorVersion, minorVersion] = fullVersion.split(".").map(Number);
	if (Number.isNaN(majorVersion) || Number.isNaN(minorVersion))
		throw new Error(`Could not parse version ${fullVersion}`);

	if (majorVersion <= 9 || (majorVersion === 10 && minorVersion <= 6))
		return "";

	if (
		(majorVersion === 10 && minorVersion <= 13) ||
		(majorVersion === 11 && minorVersion <= 8) ||
		(majorVersion === 12 && minorVersion <= 3)
	)
		// biome-ignore lint/style/noUnusedTemplateLiteral: Used for Comment tagged template
		return /* ts */ `, { s3Import: true }`;

	// biome-ignore lint/style/noUnusedTemplateLiteral: Used for Comment tagged template
	return /* ts */ `, { s3Import: true, s3Export: true }`;
};

const _getStaticInstance = (
	{ version, isDeprecated }: DeprecableEngineVersion,
	engineKey: EngineKey,
) => {
	const { fullVersion, majorVersion } = getVersionFromCdkEngineVersion(version);

	return /* ts */ `
  ${_getStaticComment({ version, isDeprecated }, engineKey)}
  public static readonly VER_${fullVersion
		.toLocaleUpperCase()
		.replace(/\.|-/g, "_")
		.replace(
			/RU.+RUR[_-]/,
			"",
		)} = ${engineKey}.of('${fullVersion}', '${majorVersion}');
`;
};

const getAuroraMysqlStatic = (
	{ version, isDeprecated }: DeprecableEngineVersion,
	engineKey: EngineKey,
) => {
	const { fullVersion } = getVersionFromCdkEngineVersion(version);
	const parts = fullVersion.split(".");

	return /* ts */ `
  ${_getStaticComment({ version, isDeprecated }, engineKey)}
   public static readonly VER_${parts
			.slice(-3)
			.join("_")} = ${engineKey}.builtIn_${parts[0]}_${parts[1]}('${parts
			.slice(3)
			.join(".")}');
`;
};

const getPostgresStatic = (
	{ version, isDeprecated }: DeprecableEngineVersion,
	engineKey: EngineKey,
) => {
	const { fullVersion, majorVersion } = getVersionFromCdkEngineVersion(version);

	return /* ts */ `
  ${_getStaticComment({ version, isDeprecated }, engineKey)}
  public static readonly VER_${fullVersion.replace(
		/\./g,
		"_",
	)} = ${engineKey}.of('${fullVersion}', '${majorVersion}'${getPostgresStaticFeatures(
		version,
	)});
`;
};

const getStatic = (
	engineVersion: DeprecableEngineVersion,
	engineKey: EngineKey,
) => {
	switch (engineKey) {
		case "PostgresEngineVersion":
		case "AuroraPostgresEngineVersion":
			return getPostgresStatic(engineVersion, engineKey);
		case "MysqlEngineVersion":
		case "MariaDbEngineVersion":
		case "OracleEngineVersion":
		case "SqlServerEngineVersion":
			return _getStaticInstance(engineVersion, engineKey);

		case "AuroraMysqlEngineVersion":
			return getAuroraMysqlStatic(
				engineVersion as DeprecableEngineVersion<AuroraMysqlEngineVersion>,
				engineKey,
			);
		default:
			return "NOT IMPLEMENTED";
	}
};

const runSdk = async ({ sdkEngines, cdkEngines, engineKey }: RunProps) => {
	const guard = CdkEngineGuard[engineKey];

	for (const cdkEngine of cdkEngines) {
		if (!guard(cdkEngine.version)) continue;

		const sdkEngine = sdkEngines.find(
			({ version }) =>
				guard(version) && isEngineVersionEqualWith(version, cdkEngine.version),
		);

		if (!sdkEngine) {
			const version = getVersionFromCdkEngineVersion(cdkEngine.version);
			if (version.fullVersion === version.majorVersion) continue;

			if (cdkEngine.isDeprecated) continue;

			console.log(
				CONSOLE_SYMBOLS.DELETE_BOX,
				stringifyEngineVersion(cdkEngine, engineKey),
			);
			console.log(getStatic({ ...cdkEngine, isDeprecated: true }, engineKey));
		} else if (!cdkEngine.isDeprecated && sdkEngine.isDeprecated) {
			console.log(
				CONSOLE_SYMBOLS.UPDATE_BOX,
				stringifyEngineVersion(cdkEngine, engineKey),
				"@deprecated",
			);
			console.log(getStatic(sdkEngine, engineKey));
		} else if (cdkEngine.isDeprecated && !sdkEngine.isDeprecated) {
			console.log(
				CONSOLE_SYMBOLS.UPDATE_BOX,
				stringifyEngineVersion(cdkEngine, engineKey),
				"not @deprecated",
			);
			console.log(getStatic(sdkEngine, engineKey));
		}
	}

	for (const sdkEngine of sdkEngines) {
		if (!guard(sdkEngine.version)) continue;
		if (
			engineKey === "PostgresEngineVersion" &&
			(sdkEngine.version as PostgresEngineVersion).postgresFullVersion
				// PSQL 9.4 was never added to the CDK, as they were deprecated from the start
				.startsWith("9.4.")
		)
			continue;

		const cdkEngine = cdkEngines.find(
			({ version }) =>
				guard(version) && isEngineVersionEqualWith(version, sdkEngine.version),
		);

		if (!cdkEngine) {
			console.log(
				CONSOLE_SYMBOLS.ADD_BOX,
				stringifyEngineVersion(sdkEngine, engineKey),
				sdkEngine.isDeprecated ? "@deprecated" : "",
			);
			console.log(getStatic(sdkEngine, engineKey));
		}
	}
};

export const runInstanceEngine = async () => {
	const cdkEngines = getCDKInstanceEngineVersions();

	runSdk({
		sdkEngines: await getSdkPostgresEngineVersions(),
		cdkEngines,
		engineKey: "PostgresEngineVersion",
	});

	runSdk({
		sdkEngines: await getSdkMysqlEngineVersions(),
		cdkEngines,
		engineKey: "MysqlEngineVersion",
	});

	runSdk({
		sdkEngines: await getSdkMariaDbEngineVersions(),
		cdkEngines,
		engineKey: "MariaDbEngineVersion",
	});

	runSdk({
		sdkEngines: await getSdkOracleEngineVersions(OracleEngines),
		cdkEngines,
		engineKey: "OracleEngineVersion",
	});

	runSdk({
		sdkEngines: await getSdkSqlServerEngineVersions(SqlServerEngines),
		cdkEngines,
		engineKey: "SqlServerEngineVersion",
	});
};

export const runClusterEngine = async () => {
	const cdkEngines = getCDKClusterEngineVersions();

	runSdk({
		sdkEngines: await getSdkAuroraMysqlEngineVersions(),
		cdkEngines,
		engineKey: "AuroraMysqlEngineVersion",
	});

	runSdk({
		sdkEngines: await getSdkAuroraPostgresEngineVersions(),
		cdkEngines,
		engineKey: "AuroraPostgresEngineVersion",
	});
};

// if (process.env.NODE_ENV !== "test") void runInstanceEngine();
// if (process.env.NODE_ENV !== "test") void runClusterEngine();
