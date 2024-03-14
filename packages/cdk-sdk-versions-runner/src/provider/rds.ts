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
import { CdkSdkVersionRunner } from "../runner";
import {
	AuroraEngines,
	OracleEngines,
	RdsEngine,
	SqlServerEngines,
	getCDKClusterEngineVersions,
	getCDKInstanceEngineVersions,
	getVersionFromCdkEngineVersion,
	type CdkEngineVersion,
	type CdkEngineVersionType,
	type DeprecableEngineVersion,
	type EngineKey,
} from "../util/provider/rds";

export const MISSING_ENGINE_VERSION = "__MISSING_ENGINE_VERSION__";
export const MISSING_MAJOR_ENGINE_VERSION = "__MISSING_MAJOR_ENGINE_VERSION__";

const client = new RDSClient({});

class RdsEngineRunner<
	EngineVersion extends CdkEngineVersion,
> extends CdkSdkVersionRunner<EngineVersion, EngineVersion> {
	constructor(
		protected readonly engineVesionType: CdkEngineVersionType,
		private readonly engines: RdsEngine[],
	) {
		super(`Rds${engineVesionType.name}`);
	}

	private static fetchSdkEngineVersionPromiseMap: Partial<
		Record<RdsEngine, Promise<DeprecableEngineVersion<CdkEngineVersion>[]>>
	> = {};
	private async fetchSdkEngineVersion<EngineVersion extends CdkEngineVersion>(
		engine: RdsEngine,
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
		const versions = await Promise.all(
			this.engines.map<Promise<DeprecableEngineVersion<EngineVersion>[]>>(
				(engine) => {
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

		return versions.flat();
	}

	private static fetchCdkInstanceEnginePromise: Promise<
		DeprecableEngineVersion[]
	>;
	private static fetchCdkClusterEnginePromise: Promise<
		DeprecableEngineVersion[]
	>;

	protected async generateCdkVersions() {
		const promises = new Set<Promise<DeprecableEngineVersion[]>>();
		for (const engine of this.engines) {
			if (AuroraEngines.includes(engine)) {
				if (!RdsEngineRunner.fetchCdkClusterEnginePromise) {
					RdsEngineRunner.fetchCdkClusterEnginePromise = (async () =>
						getCDKClusterEngineVersions())();
				}

				promises.add(RdsEngineRunner.fetchCdkClusterEnginePromise);
			} else {
				if (!RdsEngineRunner.fetchCdkInstanceEnginePromise) {
					RdsEngineRunner.fetchCdkInstanceEnginePromise = (async () =>
						getCDKInstanceEngineVersions())();
				}

				promises.add(RdsEngineRunner.fetchCdkInstanceEnginePromise);
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
	constructor() {
		super(OracleEngineVersion, OracleEngines);
	}
}

export class RdsSqlServerEngineRunner extends RdsEngineRunner<SqlServerEngineVersion> {
	constructor() {
		super(SqlServerEngineVersion, SqlServerEngines);
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

const c = new RdsOracleEngineRunner();
c.run().then((res) => c.consoleOutputResults(res));

// *****************************************************************************
// TODO integrate code generation in abstract runner
// *****************************************************************************

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
