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
import type { DeprecableVersion } from "../../runner";
import { CdkLibPath } from "../cdk";
import { getStaticFieldComments } from "../tsdoc";

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

export const OracleEngines = [
	RdsEngine.ORACLE_SE2,
	RdsEngine.ORACLE_SE2_CDB,
	RdsEngine.ORACLE_EE,
	RdsEngine.ORACLE_EE_CDB,
] as const;

export const SqlServerEngines = [
	RdsEngine.SQLSERVER_SE,
	RdsEngine.SQLSERVER_EX,
	RdsEngine.SQLSERVER_WEB,
	RdsEngine.SQLSERVER_EE,
] as const;

export type CdkEngineVersionType =
	| typeof OracleEngineVersion
	| typeof MysqlEngineVersion
	| typeof MariaDbEngineVersion
	| typeof PostgresEngineVersion
	| typeof SqlServerEngineVersion
	| typeof AuroraMysqlEngineVersion
	| typeof AuroraPostgresEngineVersion;

export type CdkEngineVersion = InstanceType<// @ts-ignore
CdkEngineVersionType>;

export const CdkEngineGuard = {
	// Instance
	OracleEngineVersion: (
		engineVersion: CdkEngineVersion,
	): engineVersion is OracleEngineVersion =>
		!!(engineVersion as OracleEngineVersion).oracleFullVersion,
	MysqlEngineVersion: (
		engineVersion: CdkEngineVersion,
	): engineVersion is MysqlEngineVersion =>
		!!(engineVersion as MysqlEngineVersion).mysqlFullVersion,
	MariaDbEngineVersion: (
		engineVersion: CdkEngineVersion,
	): engineVersion is MariaDbEngineVersion =>
		!!(engineVersion as MariaDbEngineVersion).mariaDbFullVersion,
	PostgresEngineVersion: (
		engineVersion: CdkEngineVersion,
	): engineVersion is PostgresEngineVersion =>
		!!(engineVersion as PostgresEngineVersion).postgresFullVersion,
	SqlServerEngineVersion: (
		engineVersion: CdkEngineVersion,
	): engineVersion is SqlServerEngineVersion =>
		!!(engineVersion as SqlServerEngineVersion).sqlServerFullVersion,

	// Cluster
	AuroraMysqlEngineVersion: (
		engineVersion: CdkEngineVersion,
	): engineVersion is AuroraMysqlEngineVersion =>
		!!(engineVersion as AuroraMysqlEngineVersion).auroraMysqlFullVersion,
	AuroraPostgresEngineVersion: (
		engineVersion: CdkEngineVersion,
	): engineVersion is AuroraPostgresEngineVersion =>
		!!(engineVersion as AuroraPostgresEngineVersion).auroraPostgresFullVersion,
};

export type EngineKey = keyof typeof CdkEngineGuard;

const CdkEngineVersion: Record<
	EngineKey,
	(engineVersion: CdkEngineVersion) => {
		fullVersion: string;
		majorVersion: string;
	}
> = {
	OracleEngineVersion: (engineVersion: OracleEngineVersion) => ({
		fullVersion: engineVersion.oracleFullVersion,
		majorVersion: engineVersion.oracleMajorVersion,
	}),
	MysqlEngineVersion: (engineVersion: MysqlEngineVersion) => ({
		fullVersion: engineVersion.mysqlFullVersion,
		majorVersion: engineVersion.mysqlMajorVersion,
	}),
	MariaDbEngineVersion: (engineVersion: MariaDbEngineVersion) => ({
		fullVersion: engineVersion.mariaDbFullVersion,
		majorVersion: engineVersion.mariaDbMajorVersion,
	}),
	PostgresEngineVersion: (engineVersion: PostgresEngineVersion) => ({
		fullVersion: engineVersion.postgresFullVersion,
		majorVersion: engineVersion.postgresMajorVersion,
	}),
	SqlServerEngineVersion: (engineVersion: SqlServerEngineVersion) => ({
		fullVersion: engineVersion.sqlServerFullVersion,
		majorVersion: engineVersion.sqlServerMajorVersion,
	}),

	AuroraMysqlEngineVersion: (engineVersion: AuroraMysqlEngineVersion) => ({
		fullVersion: engineVersion.auroraMysqlFullVersion,
		majorVersion: engineVersion.auroraMysqlMajorVersion,
	}),
	AuroraPostgresEngineVersion: (
		engineVersion: AuroraPostgresEngineVersion,
	) => ({
		fullVersion: engineVersion.auroraPostgresFullVersion,
		majorVersion: engineVersion.auroraPostgresMajorVersion,
	}),
};

export const getVersionFromCdkEngineVersion = (
	engineVersion: CdkEngineVersion,
) => {
	if (CdkEngineGuard.OracleEngineVersion(engineVersion))
		return CdkEngineVersion.OracleEngineVersion(engineVersion);
	if (CdkEngineGuard.MysqlEngineVersion(engineVersion))
		return CdkEngineVersion.MysqlEngineVersion(engineVersion);
	if (CdkEngineGuard.MariaDbEngineVersion(engineVersion))
		return CdkEngineVersion.MariaDbEngineVersion(engineVersion);
	if (CdkEngineGuard.PostgresEngineVersion(engineVersion))
		return CdkEngineVersion.PostgresEngineVersion(engineVersion);
	if (CdkEngineGuard.SqlServerEngineVersion(engineVersion))
		return CdkEngineVersion.SqlServerEngineVersion(engineVersion);

	if (CdkEngineGuard.AuroraMysqlEngineVersion(engineVersion))
		return CdkEngineVersion.AuroraMysqlEngineVersion(engineVersion);
	if (CdkEngineGuard.AuroraPostgresEngineVersion(engineVersion))
		return CdkEngineVersion.AuroraPostgresEngineVersion(engineVersion);

	throw new Error(`Unknown engine version: ${JSON.stringify(engineVersion)}`);
};

const compareEngineVersions = (a: CdkEngineVersion, b: CdkEngineVersion) =>
	getVersionFromCdkEngineVersion(a).fullVersion ===
	getVersionFromCdkEngineVersion(b).fullVersion;

export const isEngineVersionEqualWith = (
	a: CdkEngineVersion,
	b: CdkEngineVersion,
) => isEqualWith(a, b, compareEngineVersions);

export const CDK_LIB_INSTANCE_ENGINE_PATH = new CdkLibPath(
	"aws-rds/lib/instance-engine.d.ts",
);
export const CDK_LIB_CLUSTER_ENGINE_PATH = new CdkLibPath(
	"aws-rds/lib/cluster-engine.d.ts",
);

export type DeprecableEngineVersion<
	T extends CdkEngineVersion = CdkEngineVersion,
> = DeprecableVersion<T>;

const getVersion = <T extends CdkEngineVersionType = CdkEngineVersion>(
	className: EngineKey,
	fieldName: keyof T & string,
	engineVersionEnum: T,
) => {
	if (engineVersionEnum[fieldName]) return engineVersionEnum[fieldName] as T;

	let fullVersion = fieldName
		.replace(/^VER_/, "")
		.replace(/_/g, ".")
		.toLocaleLowerCase();

	if (className === "OracleEngineVersion") {
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
			className === "OracleEngineVersion"
				? 1
				: className === "SqlServerEngineVersion"
				  ? 2
				  : versionComponents.length - 1,
		)
		.join(".");

	if (className === "AuroraMysqlEngineVersion") {
		const mysqlBuiltInVersion =
			Number(versionComponents[0]) <= 2 ? "5.7" : "8.0";

		fullVersion = `${mysqlBuiltInVersion}.mysql_aurora.${fullVersion}`;
		majorVersion = mysqlBuiltInVersion;
	}

	console.warn(
		`Unknown version: ${className}.${fieldName}, replacing with .of("${fullVersion}", "${majorVersion}")`,
	);

	return engineVersionEnum.of(fullVersion, majorVersion) as unknown as T;
};

function _getCDKVersions(filename: string) {
	const engineVersions: DeprecableEngineVersion[] = [];

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

		let version: CdkEngineVersion | undefined;
		switch (className) {
			// Instance
			case "MysqlEngineVersion":
				version = getVersion(
					className,
					fieldName as keyof typeof MysqlEngineVersion,
					MysqlEngineVersion,
				);
				break;
			case "OracleEngineVersion":
				version = getVersion(
					className,
					fieldName as keyof typeof OracleEngineVersion,
					OracleEngineVersion,
				);
				break;
			case "MariaDbEngineVersion":
				version = getVersion(
					className,
					fieldName as keyof typeof MariaDbEngineVersion,
					MariaDbEngineVersion,
				);
				break;
			case "PostgresEngineVersion":
				version = getVersion(
					className,
					fieldName as keyof typeof PostgresEngineVersion,
					PostgresEngineVersion,
				);
				break;
			case "SqlServerEngineVersion":
				version = getVersion(
					className,
					fieldName as keyof typeof SqlServerEngineVersion,
					SqlServerEngineVersion,
				);
				break;

			// Cluster
			case "AuroraMysqlEngineVersion":
				version = getVersion(
					className,
					fieldName as keyof typeof AuroraMysqlEngineVersion,
					AuroraMysqlEngineVersion,
				);
				break;
			case "AuroraPostgresEngineVersion":
				version = getVersion(
					className,
					fieldName as keyof typeof AuroraPostgresEngineVersion,
					AuroraPostgresEngineVersion,
				);
				break;
			// Deprecated
			case "OracleLegacyEngineVersion":
				continue;
			default:
				throw new Error(`Unknown class name: ${className}`);
		}

		if (!version) {
			throw new Error(`Unknown engine version: ${className}.${fieldName}`);
		}

		engineVersions.push({
			version,
			isDeprecated,
		});
	}

	return engineVersions;
}

export const getCDKInstanceEngineVersions = () =>
	_getCDKVersions(CDK_LIB_INSTANCE_ENGINE_PATH.auto);

export const getCDKClusterEngineVersions = () =>
	_getCDKVersions(CDK_LIB_CLUSTER_ENGINE_PATH.auto);
