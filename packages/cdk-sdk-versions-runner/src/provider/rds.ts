import {
	RDSClient,
	paginateDescribeDBEngineVersions,
	type DBEngineVersion,
} from "@aws-sdk/client-rds";
import {
	AuroraMysqlEngineVersion,
	AuroraPostgresEngineVersion,
	MariaDbEngineVersion,
	MysqlEngineVersion,
	OracleEngineVersion,
	PostgresEngineVersion,
	SqlServerEngineVersion,
} from "aws-cdk-lib/aws-rds";
import { isEqualWith } from "lodash";
import { CdkSdkVersionRunner, type DeprecableVersion } from "../runner";
import { CdkLibPath } from "../util/cdk";
import { getStaticFieldComments } from "../util/tsdoc";

export enum RdsEngine {
	AURORA_MYSQL = "aurora-mysql",
	AURORA_POSTGRESQL = "aurora-postgresql",
	CUSTOM_ORACLE_EE = "custom-oracle-ee",
	DB2_AE = "db2-ae",
	DB2_SE = "db2-se",
	MARIADB = "mariadb",
	MYSQL = "mysql",
	ORACLE_EE = "oracle-ee",
	ORACLE_EE_CDB = "oracle-ee-cdb",
	ORACLE_SE2 = "oracle-se2",
	ORACLE_SE2_CDB = "oracle-se2-cdb",
	POSTGRES = "postgres",
	SQLSERVER_EE = "sqlserver-ee",
	SQLSERVER_SE = "sqlserver-se",
	SQLSERVER_EX = "sqlserver-ex",
	SQLSERVER_WEB = "sqlserver-web",
}

const ClusterEngines = [RdsEngine.AURORA_MYSQL, RdsEngine.AURORA_POSTGRESQL];

export type CdkEngineVersionType =
	| typeof OracleEngineVersion
	| typeof MysqlEngineVersion
	| typeof MariaDbEngineVersion
	| typeof PostgresEngineVersion
	| typeof SqlServerEngineVersion
	| typeof AuroraMysqlEngineVersion
	| typeof AuroraPostgresEngineVersion;

/* export type CdkEngineVersion = ReturnType<//@ts-ignore private constructor
CdkEngineVersionType>; */

export type CdkEngineVersion =
	| OracleEngineVersion
	| MysqlEngineVersion
	| MariaDbEngineVersion
	| PostgresEngineVersion
	| SqlServerEngineVersion
	| AuroraMysqlEngineVersion
	| AuroraPostgresEngineVersion;

type CdkInstanceEngineVersion = Exclude<
	CdkEngineVersion,
	"AuroraMysqlEngineVersion" | "AuroraPostgresEngineVersion"
>;
type CdkClusterEngineVersion =
	| AuroraMysqlEngineVersion
	| AuroraPostgresEngineVersion;

const CdkEngineVersionNameMap = {
	OracleEngineVersion: OracleEngineVersion,
	MysqlEngineVersion: MysqlEngineVersion,
	MariaDbEngineVersion: MariaDbEngineVersion,
	PostgresEngineVersion: PostgresEngineVersion,
	SqlServerEngineVersion: SqlServerEngineVersion,
	AuroraMysqlEngineVersion: AuroraMysqlEngineVersion,
	AuroraPostgresEngineVersion: AuroraPostgresEngineVersion,
} as const;

type EngineUtil<T extends CdkEngineVersion> = {
	isVersion: (version: CdkEngineVersion) => version is T;
	getVersion: (version: T) => { fullVersion: string; majorVersion: string };
};

const EngineUtils = {
	// Instance engines
	OracleEngineVersion: {
		isVersion: (version: CdkEngineVersion): version is OracleEngineVersion =>
			!!(version as OracleEngineVersion).oracleFullVersion,
		getVersion: (version: OracleEngineVersion) => ({
			fullVersion: version.oracleFullVersion,
			majorVersion: version.oracleMajorVersion,
		}),
	} satisfies EngineUtil<OracleEngineVersion>,
	MysqlEngineVersion: {
		isVersion: (version: CdkEngineVersion): version is MysqlEngineVersion =>
			!!(version as MysqlEngineVersion).mysqlFullVersion,
		getVersion: (version: MysqlEngineVersion) => ({
			fullVersion: version.mysqlFullVersion,
			majorVersion: version.mysqlMajorVersion,
		}),
	} satisfies EngineUtil<MysqlEngineVersion>,
	MariaDbEngineVersion: {
		isVersion: (version: CdkEngineVersion): version is MariaDbEngineVersion =>
			!!(version as MariaDbEngineVersion).mariaDbFullVersion,
		getVersion: (version: MariaDbEngineVersion) => ({
			fullVersion: version.mariaDbFullVersion,
			majorVersion: version.mariaDbMajorVersion,
		}),
	} satisfies EngineUtil<MariaDbEngineVersion>,
	PostgresEngineVersion: {
		isVersion: (version: CdkEngineVersion): version is PostgresEngineVersion =>
			!!(version as PostgresEngineVersion).postgresFullVersion,
		getVersion: (version: PostgresEngineVersion) => ({
			fullVersion: version.postgresFullVersion,
			majorVersion: version.postgresMajorVersion,
		}),
	} satisfies EngineUtil<PostgresEngineVersion>,
	SqlServerEngineVersion: {
		isVersion: (version: CdkEngineVersion): version is SqlServerEngineVersion =>
			!!(version as SqlServerEngineVersion).sqlServerFullVersion,
		getVersion: (version: SqlServerEngineVersion) => ({
			fullVersion: version.sqlServerFullVersion,
			majorVersion: version.sqlServerMajorVersion,
		}),
	} satisfies EngineUtil<SqlServerEngineVersion>,

	// Cluster engines
	AuroraMysqlEngineVersion: {
		isVersion: (
			version: CdkEngineVersion,
		): version is AuroraMysqlEngineVersion =>
			!!(version as AuroraMysqlEngineVersion).auroraMysqlFullVersion,
		getVersion: (version: AuroraMysqlEngineVersion) => ({
			fullVersion: version.auroraMysqlFullVersion,
			majorVersion: version.auroraMysqlMajorVersion,
		}),
	} satisfies EngineUtil<AuroraMysqlEngineVersion>,
	AuroraPostgresEngineVersion: {
		isVersion: (
			version: CdkEngineVersion,
		): version is AuroraPostgresEngineVersion =>
			!!(version as AuroraPostgresEngineVersion).auroraPostgresFullVersion,
		getVersion: (version: AuroraPostgresEngineVersion) => ({
			fullVersion: version.auroraPostgresFullVersion,
			majorVersion: version.auroraPostgresMajorVersion,
		}),
	} satisfies EngineUtil<AuroraPostgresEngineVersion>,
};

// type EngineKey = keyof typeof EngineUtils;
type CdkEngineVersionName = keyof typeof CdkEngineVersionNameMap;

export const getVersionFromCdkEngineVersion = (
	engineVersion: CdkEngineVersion,
) => {
	for (const util of Object.values(
		EngineUtils,
	) as EngineUtil<CdkEngineVersion>[]) {
		if (util.isVersion(engineVersion)) return util.getVersion(engineVersion);
	}

	throw new Error(`Unknown engine version: ${JSON.stringify(engineVersion)}`);
};

export type DeprecableEngineVersion<T extends CdkEngineVersion> =
	DeprecableVersion<T>;

const getVersion = <T extends CdkEngineVersionType>(
	engineName: CdkEngineVersionName,
	fieldName: keyof T & string,
	engineVersionEnum: T,
) => {
	if (engineVersionEnum[fieldName]) return engineVersionEnum[fieldName] as T;

	let fullVersion = fieldName
		.replace(/^VER_/, "")
		.replace(/_/g, ".")
		.toLocaleLowerCase();

	if (engineName === "OracleEngineVersion") {
		fullVersion = fullVersion.replace(
			// Add 'ru-' and 'rur-' prefixes to the last three parts
			/\.(\d{4})\.(\d{2})\.[rR](\w+)$/,
			".ru-$1-$2.rur-$1-$2.r$3",
		);
	}

	const versionComponents = fullVersion.split(".");

	let majorVersion = versionComponents
		.slice(
			0,
			engineName === "OracleEngineVersion"
				? 1
				: engineName === "SqlServerEngineVersion"
				  ? 2
				  : versionComponents.length - 1,
		)
		.join(".");

	if (engineName === "AuroraMysqlEngineVersion") {
		const mysqlBuiltInVersion =
			Number(versionComponents[0]) <= 2 ? "5.7" : "8.0";

		fullVersion = `${mysqlBuiltInVersion}.mysql_aurora.${fullVersion}`;
		majorVersion = mysqlBuiltInVersion;
	}

	console.warn(
		`Unknown version: ${engineName}.${fieldName}, replacing with .of("${fullVersion}", "${majorVersion}")`,
	);

	return engineVersionEnum.of(fullVersion, majorVersion) as unknown as T;
};

/* export const getCDKInstanceEngineVersions = <
	T extends CdkEngineVersion = CdkEngineVersion,
>() => _getCDKVersions<T>(CDK_LIB_INSTANCE_ENGINE_PATH.auto);

export const getCDKClusterEngineVersions = <
	T extends CdkEngineVersion = CdkEngineVersion,
>() => _getCDKVersions<T>(CDK_LIB_CLUSTER_ENGINE_PATH.auto); */

class RdsEngineRunner<
	EngineVersion extends CdkEngineVersion,
> extends CdkSdkVersionRunner<EngineVersion, EngineVersion> {
	private static readonly client = new RDSClient({});

	public static readonly instanceEnginePath = new CdkLibPath(
		"aws-rds/lib/instance-engine.d.ts",
	);
	public static readonly clusterEnginePath = new CdkLibPath(
		"aws-rds/lib/cluster-engine.d.ts",
	);

	public static readonly MISSING_ENGINE_VERSION = "__MISSING_ENGINE_VERSION__";
	public static readonly MISSING_MAJOR_ENGINE_VERSION =
		"__MISSING_MAJOR_ENGINE_VERSION__";

	constructor(
		protected readonly engineVesionType: CdkEngineVersionType,
		private readonly engines: RdsEngine[],
	) {
		super(`Rds${engineVesionType.name}`);
	}

	protected static get isCacheEnabled() {
		return true;
	}

	private async fetchSdkEngineVersion<EngineVersion extends CdkEngineVersion>(
		engine: RdsEngine,
		engiveVersionType: CdkEngineVersionType,
	): Promise<DeprecableEngineVersion<EngineVersion>[]> {
		const versions: DBEngineVersion[] = [];
		const paginator = paginateDescribeDBEngineVersions(
			{ client: RdsEngineRunner.client, pageSize: 100 },
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
				EngineVersion = RdsEngineRunner.MISSING_ENGINE_VERSION,
				MajorEngineVersion = RdsEngineRunner.MISSING_MAJOR_ENGINE_VERSION,
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

	private static fetchSdkEngineVersionPromiseMap: Partial<
		Record<RdsEngine, Promise<DeprecableEngineVersion<CdkEngineVersion>[]>>
	> = {};
	protected async fetchSdkVersions() {
		const versions = await Promise.all(
			this.engines.map<Promise<DeprecableEngineVersion<EngineVersion>[]>>(
				(engine) => {
					if (!RdsEngineRunner.isCacheEnabled)
						return this.fetchSdkEngineVersion<EngineVersion>(
							engine,
							this.engineVesionType,
						);

					if (!RdsEngineRunner.fetchSdkEngineVersionPromiseMap[engine]) {
						RdsEngineRunner.fetchSdkEngineVersionPromiseMap[engine] =
							this.fetchSdkEngineVersion<EngineVersion>(
								engine,
								this.engineVesionType,
							);
					}

					return this.fetchSdkEngineVersion(engine, this.engineVesionType);
				},
			),
		);

		console.log(this.engines, versions);

		return versions.flat();
	}

	private static async _getCDKVersions<
		T extends CdkEngineVersion = CdkEngineVersion,
	>(filename: string) {
		const engineVersions: DeprecableEngineVersion<T>[] = [];

		for (const { className, fieldName, isDeprecated } of getStaticFieldComments(
			filename,
		)) {
			if (
				[
					"DatabaseInstanceEngine",
					"DatabaseClusterEngine",
					"AuroraEngineVersion",
				].includes(className)
			)
				continue;

			let version: T;
			switch (className) {
				// Instance
				case "MysqlEngineVersion":
					version = getVersion(
						className,
						fieldName as keyof typeof MysqlEngineVersion,
						MysqlEngineVersion,
					) as unknown as T;
					break;
				case "OracleEngineVersion":
					version = getVersion(
						className,
						fieldName as keyof typeof OracleEngineVersion,
						OracleEngineVersion,
					) as unknown as T;
					break;
				case "MariaDbEngineVersion":
					version = getVersion(
						className,
						fieldName as keyof typeof MariaDbEngineVersion,
						MariaDbEngineVersion,
					) as unknown as T;
					break;
				case "PostgresEngineVersion":
					version = getVersion(
						className,
						fieldName as keyof typeof PostgresEngineVersion,
						PostgresEngineVersion,
					) as unknown as T;
					break;
				case "SqlServerEngineVersion":
					version = getVersion(
						className,
						fieldName as keyof typeof SqlServerEngineVersion,
						SqlServerEngineVersion,
					) as unknown as T;
					break;

				// Cluster
				case "AuroraMysqlEngineVersion":
					version = getVersion(
						className,
						fieldName as keyof typeof AuroraMysqlEngineVersion,
						AuroraMysqlEngineVersion,
					) as unknown as T;
					break;
				case "AuroraPostgresEngineVersion":
					version = getVersion(
						className,
						fieldName as keyof typeof AuroraPostgresEngineVersion,
						AuroraPostgresEngineVersion,
					) as unknown as T;
					break;
				// Deprecated
				case "OracleLegacyEngineVersion":
					continue;
				default:
					throw new Error(`Unknown class name: ${className}`);
			}

			engineVersions.push({ version, isDeprecated });
		}

		return engineVersions;
	}

	private static fetchCdkInstanceEnginePromise: Promise<
		DeprecableEngineVersion<CdkInstanceEngineVersion>[]
	>;
	private static fetchCdkClusterEnginePromise: Promise<
		DeprecableEngineVersion<CdkClusterEngineVersion>[]
	>;

	protected async generateCdkVersions() {
		const promises = new Set<
			Promise<DeprecableEngineVersion<EngineVersion>[]>
		>();
		for (const engine of this.engines) {
			if (ClusterEngines.includes(engine)) {
				if (!RdsEngineRunner.isCacheEnabled) {
					promises.add(
						RdsEngineRunner._getCDKVersions<CdkClusterEngineVersion>(
							RdsEngineRunner.clusterEnginePath.auto,
						) as Promise<DeprecableEngineVersion<EngineVersion>[]>,
					);
					continue;
				}

				if (!RdsEngineRunner.fetchCdkClusterEnginePromise) {
					RdsEngineRunner.fetchCdkClusterEnginePromise =
						RdsEngineRunner._getCDKVersions<CdkClusterEngineVersion>(
							RdsEngineRunner.clusterEnginePath.auto,
						);
				}

				promises.add(
					RdsEngineRunner.fetchCdkClusterEnginePromise as Promise<
						DeprecableEngineVersion<EngineVersion>[]
					>,
				);
			} else {
				if (!RdsEngineRunner.isCacheEnabled) {
					promises.add(
						RdsEngineRunner._getCDKVersions<CdkInstanceEngineVersion>(
							RdsEngineRunner.instanceEnginePath.auto,
						) as Promise<DeprecableEngineVersion<EngineVersion>[]>,
					);
					continue;
				}

				if (!RdsEngineRunner.fetchCdkInstanceEnginePromise) {
					RdsEngineRunner.fetchCdkInstanceEnginePromise =
						RdsEngineRunner._getCDKVersions<CdkInstanceEngineVersion>(
							RdsEngineRunner.instanceEnginePath.auto,
						);
				}

				promises.add(
					RdsEngineRunner.fetchCdkInstanceEnginePromise as Promise<
						DeprecableEngineVersion<EngineVersion>[]
					>,
				);
			}
		}

		return (await Promise.all(promises)).flat().filter(({ version }) => {
			if (!(version instanceof this.engineVesionType)) return false;

			// filter out "latest" versions of major releases
			// such as "5.7" for MySQL standing in for all minor "5.7.x" versions
			const { fullVersion, majorVersion } =
				getVersionFromCdkEngineVersion(version);

			return fullVersion !== majorVersion;
		});
	}

	protected getCdkVersionId(version: EngineVersion) {
		return getVersionFromCdkEngineVersion(version).fullVersion;
	}

	protected getSdkVersionId(version: EngineVersion) {
		return getVersionFromCdkEngineVersion(version).fullVersion;
	}
}

export class RdsMySqlEngineRunner extends RdsEngineRunner<MysqlEngineVersion> {
	constructor() {
		super(MysqlEngineVersion, [RdsEngine.MYSQL]);
	}
}

export class RdsMariaDbEngineRunner extends RdsEngineRunner<MariaDbEngineVersion> {
	constructor() {
		super(MariaDbEngineVersion, [RdsEngine.MARIADB]);
	}
}

export class RdsPostgresEngineRunner extends RdsEngineRunner<PostgresEngineVersion> {
	constructor() {
		super(PostgresEngineVersion, [RdsEngine.POSTGRES]);
	}
}

export class RdsOracleEngineRunner extends RdsEngineRunner<OracleEngineVersion> {
	private static readonly engines: RdsEngine[] = [
		RdsEngine.ORACLE_SE2,
		RdsEngine.ORACLE_SE2_CDB,
		RdsEngine.ORACLE_EE,
		RdsEngine.ORACLE_EE_CDB,
	];

	constructor() {
		super(OracleEngineVersion, RdsOracleEngineRunner.engines);
	}
}

export class RdsSqlServerEngineRunner extends RdsEngineRunner<SqlServerEngineVersion> {
	private static readonly engines: RdsEngine[] = [
		RdsEngine.SQLSERVER_SE,
		RdsEngine.SQLSERVER_EX,
		RdsEngine.SQLSERVER_WEB,
		RdsEngine.SQLSERVER_EE,
	];

	constructor() {
		super(SqlServerEngineVersion, RdsSqlServerEngineRunner.engines);
	}
}

export class RdsAuroraMysqlEngineRunner extends RdsEngineRunner<AuroraMysqlEngineVersion> {
	constructor() {
		super(AuroraMysqlEngineVersion, [RdsEngine.AURORA_MYSQL]);
	}
}

export class RdsAuroraPostgresEngineRunner extends RdsEngineRunner<AuroraPostgresEngineVersion> {
	constructor() {
		super(AuroraPostgresEngineVersion, [RdsEngine.AURORA_POSTGRESQL]);
	}
}

// *****************************************************************************
// TODO integrate code generation in abstract runner
// *****************************************************************************

const stringifyEngineVersion = <T extends CdkEngineVersion>(
	{ version }: DeprecableEngineVersion<T>,
	engineKey: CdkEngineVersionName,
) =>
	`${engineKey}.${getVersionFromCdkEngineVersion(version)
		.fullVersion.toLocaleUpperCase()
		.replace(/\./g, "_")}`;

const humanName: Record<CdkEngineVersionName, string> = {
	PostgresEngineVersion: "PostgreSQL",
	MysqlEngineVersion: "MySQL",
	MariaDbEngineVersion: "MariaDB",
	OracleEngineVersion: "Oracle",
	SqlServerEngineVersion: "SQL Server",

	AuroraMysqlEngineVersion: "Version",
	AuroraPostgresEngineVersion: "Version",
};

const _getStaticComment = <T extends CdkEngineVersion>(
	{ version, isDeprecated }: DeprecableEngineVersion<T>,
	engineKey: CdkEngineVersionName,
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

const _getStaticInstance = <T extends CdkEngineVersion>(
	{ version, isDeprecated }: DeprecableEngineVersion<T>,
	engineKey: CdkEngineVersionName,
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

const getAuroraMysqlStatic = <T extends CdkEngineVersion>(
	{ version, isDeprecated }: DeprecableEngineVersion<T>,
	engineKey: CdkEngineVersionName,
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

const getPostgresStatic = <T extends CdkEngineVersion>(
	{ version, isDeprecated }: DeprecableEngineVersion<T>,
	engineKey: CdkEngineVersionName,
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

const getStatic = <T extends CdkEngineVersion>(
	engineVersion: DeprecableEngineVersion<T>,
	engineKey: CdkEngineVersionName,
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

const compareEngineVersions = (a: CdkEngineVersion, b: CdkEngineVersion) =>
	getVersionFromCdkEngineVersion(a).fullVersion ===
	getVersionFromCdkEngineVersion(b).fullVersion;

export const isEngineVersionEqualWith = (
	a: CdkEngineVersion,
	b: CdkEngineVersion,
) => isEqualWith(a, b, compareEngineVersions);

/* const runSdk = async ({ sdkEngines, cdkEngines, engineKey }: RunProps) => {
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
}; */
