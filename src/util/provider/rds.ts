import {
	MariaDbEngineVersion,
	MysqlEngineVersion,
	OracleEngineVersion,
	PostgresEngineVersion,
	SqlServerEngineVersion,
} from "aws-cdk-lib/aws-rds";
import { isEqualWith } from "lodash";
import { dirname, join } from "path";
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

export type OracleEngine =
	| RdsEngine.ORACLE_EE
	| RdsEngine.ORACLE_EE_CDB
	| RdsEngine.ORACLE_SE2
	| RdsEngine.ORACLE_SE2_CDB;

export type SqlServerEngine =
	| RdsEngine.SQLSERVER_EE
	| RdsEngine.SQLSERVER_SE
	| RdsEngine.SQLSERVER_EX
	| RdsEngine.SQLSERVER_WEB;

export type CdkEngineVersionType =
	| typeof OracleEngineVersion
	| typeof MysqlEngineVersion
	| typeof MariaDbEngineVersion
	| typeof PostgresEngineVersion
	| typeof SqlServerEngineVersion;

export type CdkEngineVersion = InstanceType<// @ts-ignore
CdkEngineVersionType>;

export const CdkEngineGuard = {
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
};

export type EngineKey = keyof typeof CdkEngineGuard;

export const getVersionFromCdkEngineVersion = (
	engineVersion: CdkEngineVersion,
) => {
	if (CdkEngineGuard.OracleEngineVersion(engineVersion)) {
		return {
			fullVersion: engineVersion.oracleFullVersion,
			majorVersion: engineVersion.oracleMajorVersion,
		};
	}
	if (CdkEngineGuard.MysqlEngineVersion(engineVersion)) {
		return {
			fullVersion: engineVersion.mysqlFullVersion,
			majorVersion: engineVersion.mysqlMajorVersion,
		};
	}
	if (CdkEngineGuard.MariaDbEngineVersion(engineVersion)) {
		return {
			fullVersion: engineVersion.mariaDbFullVersion,
			majorVersion: engineVersion.mariaDbMajorVersion,
		};
	}
	if (CdkEngineGuard.PostgresEngineVersion(engineVersion)) {
		return {
			fullVersion: engineVersion.postgresFullVersion,
			majorVersion: engineVersion.postgresMajorVersion,
		};
	}
	if (CdkEngineGuard.SqlServerEngineVersion(engineVersion)) {
		return {
			fullVersion: engineVersion.sqlServerFullVersion,
			majorVersion: engineVersion.sqlServerMajorVersion,
		};
	}
	throw new Error(`Unknown engine version: ${JSON.stringify(engineVersion)}`);
};

const compareEngineVersions = (a: CdkEngineVersion, b: CdkEngineVersion) =>
	getVersionFromCdkEngineVersion(a).fullVersion ===
	getVersionFromCdkEngineVersion(b).fullVersion;

export const isEngineVersionEqualWith = (
	a: CdkEngineVersion,
	b: CdkEngineVersion,
) => isEqualWith(a, b, compareEngineVersions);

export const CDK_LIB_INTERNALS_PATH = {
	get rdsInstanceEngineDeclaration() {
		return join(
			dirname(require.resolve("aws-cdk-lib")),
			"aws-rds/lib/instance-engine.d.ts",
		);
	},
};
export interface DeprecableEngineVersion {
	engineVersion: CdkEngineVersion;
	isDeprecated: boolean;
}

export function getCDKEngineVersions() {
	const engineVersions: DeprecableEngineVersion[] = [];

	const staticFields = getStaticFieldComments(
		CDK_LIB_INTERNALS_PATH.rdsInstanceEngineDeclaration,
	);
	for (const { className, fieldName, isDeprecated } of staticFields) {
		if (className === "DatabaseInstanceEngine") continue;

		let engineVersion: CdkEngineVersion | undefined;
		switch (className) {
			case "MysqlEngineVersion":
				engineVersion = MysqlEngineVersion[
					fieldName as keyof typeof MysqlEngineVersion
				] as MysqlEngineVersion;
				break;
			case "OracleEngineVersion":
				engineVersion = OracleEngineVersion[
					fieldName as keyof typeof OracleEngineVersion
				] as OracleEngineVersion;
				break;
			case "MariaDbEngineVersion":
				engineVersion = MariaDbEngineVersion[
					fieldName as keyof typeof MariaDbEngineVersion
				] as MariaDbEngineVersion;
				break;
			case "PostgresEngineVersion":
				engineVersion = PostgresEngineVersion[
					fieldName as keyof typeof PostgresEngineVersion
				] as PostgresEngineVersion;
				break;
			case "SqlServerEngineVersion":
				engineVersion = SqlServerEngineVersion[
					fieldName as keyof typeof SqlServerEngineVersion
				] as SqlServerEngineVersion;
				break;
			default:
				throw new Error(`Unknown class name: ${className}`);
		}

		if (!engineVersion) {
			throw new Error(`Unknown engine version: ${className}.${fieldName}`);
		}

		engineVersions.push({
			engineVersion,
			isDeprecated,
		});
	}

	return engineVersions;
}
