/**
 * The versions for the Aurora MySQL cluster engine
 * (those returned by `DatabaseClusterEngine.auroraMysql`).
 *
 * https://docs.aws.amazon.com/AmazonRDS/latest/AuroraMySQLReleaseNotes/Welcome.html
 */
export class AuroraMysqlEngineVersion {
	/**
	 * Version "5.7.mysql_aurora.2.10.3".
	 * @deprecated Version 5.7.mysql_aurora.2.10.3 is no longer supported by Amazon RDS.
	 */
	public static readonly VER_2_10_3 =
		AuroraMysqlEngineVersion.builtIn_5_7("2.10.3");
	/** Version "5.7.mysql_aurora.2.11.1". */
	public static readonly VER_2_11_1 =
		AuroraMysqlEngineVersion.builtIn_5_7("2.11.1");

	/**
	 * Create a new AuroraMysqlEngineVersion with an arbitrary version.
	 *
	 * @param auroraMysqlFullVersion the full version string,
	 *   for example "5.7.mysql_aurora.2.78.3.6"
	 * @param auroraMysqlMajorVersion the major version of the engine,
	 *   defaults to "5.7"
	 */
	public static of(
		auroraMysqlFullVersion: string,
		auroraMysqlMajorVersion?: string,
	): AuroraMysqlEngineVersion {
		return new AuroraMysqlEngineVersion(
			auroraMysqlFullVersion,
			auroraMysqlMajorVersion,
		);
	}

	private static builtIn_5_7(
		minorVersion: string,
		addStandardPrefix = true,
	): AuroraMysqlEngineVersion {
		return new AuroraMysqlEngineVersion(
			`5.7.${addStandardPrefix ? "mysql_aurora." : ""}${minorVersion}`,
		);
	}

	private static builtIn_8_0(minorVersion: string): AuroraMysqlEngineVersion {
		// 8.0 of the MySQL engine needs to combine the import and export Roles
		return new AuroraMysqlEngineVersion(
			`8.0.mysql_aurora.${minorVersion}`,
			"8.0",
			true,
		);
	}

	/** The full version string, for example, "5.7.mysql_aurora.1.78.3.6". */
	public readonly auroraMysqlFullVersion: string;
	/** The major version of the engine. Currently, it's either "5.7", or "8.0". */
	public readonly auroraMysqlMajorVersion: string;
	/**
	 * Whether this version requires combining the import and export IAM Roles.
	 *
	 * @internal
	 */
	public readonly _combineImportAndExportRoles?: boolean;

	private constructor(
		auroraMysqlFullVersion: string,
		auroraMysqlMajorVersion = "5.7",
		combineImportAndExportRoles?: boolean,
	) {
		this.auroraMysqlFullVersion = auroraMysqlFullVersion;
		this.auroraMysqlMajorVersion = auroraMysqlMajorVersion;
		this._combineImportAndExportRoles = combineImportAndExportRoles;
	}
}
