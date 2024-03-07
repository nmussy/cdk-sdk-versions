import {
	DBEngineVersion,
	RDSClient,
	paginateDescribeDBEngineVersions,
} from "@aws-sdk/client-rds";
import { MysqlEngineVersion, OracleEngineVersion } from "aws-cdk-lib/aws-rds";

export enum Engine {
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

const client = new RDSClient({});
export const getSDKEngineVersions = async (engine: Engine) => {
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

console.log(OracleEngineVersion, MysqlEngineVersion);
