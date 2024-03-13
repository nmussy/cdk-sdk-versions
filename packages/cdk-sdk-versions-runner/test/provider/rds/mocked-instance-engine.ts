import type {
	InstanceEngineFeatures,
	PostgresEngineFeatures,
} from "aws-cdk-lib/aws-rds";

/**
 * The versions for the PostgreSQL instance engines
 * (those returned by `DatabaseInstanceEngine.postgres`).
 */
export class PostgresEngineVersion {
	/**
	 * Version "9.6.24".
	 * @deprecated PostgreSQL 9.6 is no longer supported by Amazon RDS.
	 */
	public static readonly VER_9_6_24 = PostgresEngineVersion.of("9.6.24", "9.6");
	/** Version "12.11". */
	public static readonly VER_12_11 = PostgresEngineVersion.of("12.11", "12", {
		s3Import: true,
		s3Export: true,
	});

	/**
	 * Create a new PostgresEngineVersion with an arbitrary version.
	 *
	 * @param postgresFullVersion the full version string,
	 *   for example "13.11"
	 * @param postgresMajorVersion the major version of the engine,
	 *   for example "13"
	 */
	/**
	 * Create a new PostgresEngineVersion with an arbitrary version.
	 *
	 * @param postgresFullVersion the full version string,
	 *   for example "13.11"
	 * @param postgresMajorVersion the major version of the engine,
	 *   for example "13"
	 */
	public static of(
		postgresFullVersion: string,
		postgresMajorVersion: string,
		postgresFeatures?: PostgresEngineFeatures,
	): PostgresEngineVersion {
		return new PostgresEngineVersion(
			postgresFullVersion,
			postgresMajorVersion,
			postgresFeatures,
		);
	}
	/** The full version string, for example, "13.11". */
	public readonly postgresFullVersion: string;
	/** The major version of the engine, for example, "13". */
	public readonly postgresMajorVersion: string;

	/**
	 * The supported features for the DB engine
	 * @internal
	 */
	public readonly _features: InstanceEngineFeatures;

	private constructor(
		postgresFullVersion: string,
		postgresMajorVersion: string,
		postgresFeatures?: PostgresEngineFeatures,
	) {
		this.postgresFullVersion = postgresFullVersion;
		this.postgresMajorVersion = postgresMajorVersion;
		this._features = {
			s3Import: postgresFeatures?.s3Import ? "s3Import" : undefined,
			s3Export: postgresFeatures?.s3Export ? "s3Export" : undefined,
		};
	}
}
