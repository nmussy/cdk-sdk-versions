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
import { isEqual } from "lodash";
import {
	CdkEngineVersionType,
	DeprecableEngineVersion,
	OracleEngine,
	RdsEngine,
	SqlServerEngine,
	getCDKEngineVersions,
	isMysqlEngineVersion,
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

export const run = async () => {
	const sdkEngines = await getSdkMysqlEngineVersions();
	for (const cdkEngine of getCDKEngineVersions()) {
		if (!isMysqlEngineVersion(cdkEngine.engineVersion)) continue;

		const sdkEngine = sdkEngines.find(
			({ engineVersion }) =>
				isMysqlEngineVersion(engineVersion) &&
				isEqual(engineVersion, cdkEngine.engineVersion),
		);

		if (!sdkEngine) {
			console.log(`SDK engine not found for ${cdkEngine.engineVersion}`);
			continue;
		}

		if (!cdkEngine.isDeprecated && sdkEngine.isDeprecated) {
			console.log(
				`SDK engine ${sdkEngine.engineVersion} is deprecated, but not in the CDK`,
			);
		}

		if (cdkEngine.isDeprecated && !sdkEngine.isDeprecated) {
			console.log(
				`CDK engine ${sdkEngine.engineVersion} should not have been marked as deprecated`,
			);
		}
	}
};
