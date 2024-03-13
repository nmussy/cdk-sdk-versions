export interface DeprecableVersion<T> {
	version: T;
	isDeprecated: boolean;
}

export enum RunnerActions {
	ADD = "ADD",
	ADD_DEPRECATED = "ADD_DEPRECATED",
	UPDATE_DEPRECATED = "UPDATE_DEPRECATED",
	UPDATE_NOT_DEPRECATED = "UPDATE_NOT_DEPRECATED",
	REMOVE = "REMOVE",
}

type RunnerResults = { [action in RunnerActions]: string[] };
const generateEmptyRunnerResults = (): RunnerResults => ({
	[RunnerActions.ADD]: [],
	[RunnerActions.ADD_DEPRECATED]: [],
	[RunnerActions.UPDATE_DEPRECATED]: [],
	[RunnerActions.UPDATE_NOT_DEPRECATED]: [],
	[RunnerActions.REMOVE]: [],
});

export abstract class CdkSdkVersionRunner<TSdk, TCdk> {
	public constructor(protected readonly identifier: string) {}

	public abstract stringifySdkVersion(
		sdkVersion: DeprecableVersion<TSdk>,
	): string;
	public abstract stringifyCdkVersion(
		cdkVersion: DeprecableVersion<TCdk>,
	): string;

	public abstract fetchSdkVersions(): Promise<DeprecableVersion<TSdk>[]>;
	public abstract getCdkVersions(): DeprecableVersion<TCdk>[];

	public abstract compareCdkSdkVersions(cdk: TCdk, sdk: TSdk): boolean;

	public async run(): Promise<RunnerResults> {
		// Allows to let the SDK request to be sent while we do CPU intensive TS parsing
		const _sdkVersionsPromise = this.fetchSdkVersions();
		const cdkVersions = this.getCdkVersions();
		const sdkVersions = await _sdkVersionsPromise;

		const results = generateEmptyRunnerResults();

		for (const cdkVersion of cdkVersions) {
			const sdkVersion = sdkVersions.find(({ version }) =>
				this.compareCdkSdkVersions(cdkVersion.version, version),
			);

			if (!sdkVersion) {
				if (cdkVersion.isDeprecated) continue;

				results[RunnerActions.REMOVE].push(
					this.stringifyCdkVersion(cdkVersion),
				);
			}
		}

		return results;
	}
}
