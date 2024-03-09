import {
	InstanceEngineFeatures,
	PostgresEngineFeatures,
} from "aws-cdk-lib/aws-rds";

/**
 * The versions for the PostgreSQL instance engines
 * (those returned by `DatabaseInstanceEngine.postgres`).
 */
export declare class PostgresEngineVersion {
	/**
	 * Version "9.6.24".
	 * @deprecated PostgreSQL 9.6 is no longer supported by Amazon RDS.
	 */
	static readonly VER_9_6_24: PostgresEngineVersion;
	/** Version "12.11". */
	static readonly VER_12_11: PostgresEngineVersion;

	/**
	 * Create a new PostgresEngineVersion with an arbitrary version.
	 *
	 * @param postgresFullVersion the full version string,
	 *   for example "13.11"
	 * @param postgresMajorVersion the major version of the engine,
	 *   for example "13"
	 */
	static of(
		postgresFullVersion: string,
		postgresMajorVersion: string,
		postgresFeatures?: PostgresEngineFeatures,
	): PostgresEngineVersion;
	/** The full version string, for example, "13.11". */
	readonly postgresFullVersion: string;
	/** The major version of the engine, for example, "13". */
	readonly postgresMajorVersion: string;
	/**
	 * The supported features for the DB engine
	 * @internal
	 */
	readonly _features: InstanceEngineFeatures;
	private constructor();
}
