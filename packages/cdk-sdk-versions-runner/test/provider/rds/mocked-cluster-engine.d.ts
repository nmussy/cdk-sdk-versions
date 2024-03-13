/**
 * The versions for the Aurora MySQL cluster engine
 * (those returned by `DatabaseClusterEngine.auroraMysql`).
 *
 * https://docs.aws.amazon.com/AmazonRDS/latest/AuroraMySQLReleaseNotes/Welcome.html
 */
export declare class AuroraMysqlEngineVersion {
	/**
	 * Version "5.7.mysql_aurora.2.10.3".
	 * @deprecated Version 5.7.mysql_aurora.2.10.3 is no longer supported by Amazon RDS.
	 */
	static readonly VER_2_10_3: AuroraMysqlEngineVersion;
	/** Version "5.7.mysql_aurora.2.11.1". */
	static readonly VER_2_11_1: AuroraMysqlEngineVersion;

	/**
	 * Create a new AuroraMysqlEngineVersion with an arbitrary version.
	 *
	 * @param auroraMysqlFullVersion the full version string,
	 *   for example "5.7.mysql_aurora.2.78.3.6"
	 * @param auroraMysqlMajorVersion the major version of the engine,
	 *   defaults to "5.7"
	 */
	static of(
		auroraMysqlFullVersion: string,
		auroraMysqlMajorVersion?: string,
	): AuroraMysqlEngineVersion;
	private static builtIn_5_7;
	private static builtIn_8_0;
	/** The full version string, for example, "5.7.mysql_aurora.1.78.3.6". */
	readonly auroraMysqlFullVersion: string;
	/** The major version of the engine. Currently, it's either "5.7", or "8.0". */
	readonly auroraMysqlMajorVersion: string;
	/**
	 * Whether this version requires combining the import and export IAM Roles.
	 *
	 * @internal
	 */
	readonly _combineImportAndExportRoles?: boolean;
	private constructor();
}
