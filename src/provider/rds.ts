import {
	DBEngineVersion,
	RDSClient,
	paginateDescribeDBEngineVersions,
} from "@aws-sdk/client-rds";
import {
	MariaDbEngineVersion,
	MysqlEngineVersion,
	OracleEngineVersion,
	PostgresEngineVersion,
	SqlServerEngineVersion,
} from "aws-cdk-lib/aws-rds";
import chalk from "chalk";
import {
	CdkEngineGuard,
	CdkEngineVersionType,
	DeprecableEngineVersion,
	EngineKey,
	OracleEngine,
	RdsEngine,
	SqlServerEngine,
	getCDKEngineVersions,
	getVersionFromCdkEngineVersion,
	isEngineVersionEqualWith,
} from "../util/provider/rds";

const client = new RDSClient({});
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

const _getSdkEngineVersions = async (
	sdkEngine: RdsEngine,
	cdkEngine: CdkEngineVersionType,
) =>
	(await getSdkRdsEngineVersions(sdkEngine)).map<DeprecableEngineVersion>(
		({
			EngineVersion = MISSING_ENGINE_VERSION,
			MajorEngineVersion = MISSING_MAJOR_ENGINE_VERSION,
			Status,
		}) => ({
			engineVersion: cdkEngine.of(EngineVersion, MajorEngineVersion),
			isDeprecated: Status !== "available",
		}),
	);

export const getSdkOracleEngineVersions = async (engine: OracleEngine) =>
	_getSdkEngineVersions(engine, OracleEngineVersion);

export const getSdkMysqlEngineVersions = async () =>
	_getSdkEngineVersions(RdsEngine.MYSQL, MysqlEngineVersion);

export const getSdkMariaDbEngineVersions = async () =>
	_getSdkEngineVersions(RdsEngine.MARIADB, MariaDbEngineVersion);

export const getSdkPostgresEngineVersions = async () =>
	_getSdkEngineVersions(RdsEngine.POSTGRES, PostgresEngineVersion);

export const getSdkSqlServerEngineVersions = async (engine: SqlServerEngine) =>
	_getSdkEngineVersions(engine, SqlServerEngineVersion);

interface RunProps {
	cdkEngines: DeprecableEngineVersion[];
	sdkEngines: DeprecableEngineVersion[];
	engineKey: EngineKey;
}

const stringifyEngineVersion = (
	{ engineVersion }: DeprecableEngineVersion,
	engineKey: EngineKey,
) =>
	`${engineKey}.${getVersionFromCdkEngineVersion(engineVersion).fullVersion}`;

const CONSOLE_SYMBOLS = {
	ADD: chalk.green("[+]"),
	DELETE: chalk.red("[-]"),
	UPDATE: chalk.yellow("[~]"),
};

const runSdk = async ({ sdkEngines, cdkEngines, engineKey }: RunProps) => {
	const guard = CdkEngineGuard[engineKey];

	for (const cdkEngine of cdkEngines) {
		if (!guard(cdkEngine.engineVersion)) continue;

		const sdkEngine = sdkEngines.find(
			({ engineVersion }) =>
				guard(engineVersion) &&
				isEngineVersionEqualWith(engineVersion, cdkEngine.engineVersion),
		);

		if (!sdkEngine) {
			const version = getVersionFromCdkEngineVersion(cdkEngine.engineVersion);
			if (version.fullVersion === version.majorVersion) continue;

			console.log(
				CONSOLE_SYMBOLS.DELETE,
				stringifyEngineVersion(cdkEngine, engineKey),
			);
		} else if (!cdkEngine.isDeprecated && sdkEngine.isDeprecated) {
			console.log(
				CONSOLE_SYMBOLS.UPDATE,
				stringifyEngineVersion(cdkEngine, engineKey),
				"@deprecated",
			);
		} else if (cdkEngine.isDeprecated && !sdkEngine.isDeprecated) {
			console.log(
				CONSOLE_SYMBOLS.UPDATE,
				stringifyEngineVersion(cdkEngine, engineKey),
				"not @deprecated",
			);
		}
	}

	for (const sdkEngine of sdkEngines) {
		if (!guard(sdkEngine.engineVersion)) continue;

		const cdkEngine = cdkEngines.find(
			({ engineVersion }) =>
				guard(engineVersion) &&
				isEngineVersionEqualWith(engineVersion, sdkEngine.engineVersion),
		);

		if (!cdkEngine) {
			console.log(
				CONSOLE_SYMBOLS.ADD,
				stringifyEngineVersion(sdkEngine, engineKey),
				sdkEngine.isDeprecated ? "@deprecated" : "",
			);
		}
	}
};

export const run = async () => {
	const cdkEngines = getCDKEngineVersions();

	/* runSdk({
		sdkEngines: await getSdkMysqlEngineVersions(),
		cdkEngines,
		engineKey: "MysqlEngineVersion",
	});
	runSdk({
		sdkEngines: await getSdkMariaDbEngineVersions(),
		cdkEngines,
		engineKey: "MariaDbEngineVersion",
	}); */
	runSdk({
		sdkEngines: await getSdkPostgresEngineVersions(),
		cdkEngines,
		engineKey: "PostgresEngineVersion",
	});
};

void run();
