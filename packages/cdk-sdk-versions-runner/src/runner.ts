import type { Entries, RequireAtLeastOne } from "type-fest";
import { CONSOLE_SYMBOLS } from "./util";

export interface DeprecableVersion<T> {
	version: T;
	isDeprecated: boolean;
}

export enum RunnerActions {
	ADD = "ADD",
	ADD_AS_DEPRECATED = "ADD_AS_DEPRECATED",
	UPDATE_SET_DEPRECATED = "UPDATE_SET_DEPRECATED",
	UPDATE_SET_NOT_DEPRECATED = "UPDATE_SET_NOT_DEPRECATED",
	REMOVE = "REMOVE",
}

const runnerActionConsoleTaggedTemplate: {
	[action in RunnerActions]: (version: string) => string;
} = {
	[RunnerActions.ADD]: (version) => `${CONSOLE_SYMBOLS.ADD_BOX} ${version}`,
	[RunnerActions.ADD_AS_DEPRECATED]: (version) =>
		`${CONSOLE_SYMBOLS.ADD_BOX} ${version} @deprecated`,
	[RunnerActions.UPDATE_SET_DEPRECATED]: (version) =>
		`${CONSOLE_SYMBOLS.UPDATE_BOX} ${version} ${CONSOLE_SYMBOLS.ADD} @deprecated`,
	[RunnerActions.UPDATE_SET_NOT_DEPRECATED]: (version) =>
		`${CONSOLE_SYMBOLS.UPDATE_BOX} ${version} ${CONSOLE_SYMBOLS.DELETE} @deprecated`,
	[RunnerActions.REMOVE]: (version) =>
		`${CONSOLE_SYMBOLS.DELETE_BOX} ${version}`,
};

type RunnerResult<TCdk, TSdk> = {
	result: string;
	cdkVersion?: TCdk;
	sdkVersion?: TSdk;
};

type RunnerResults<TCdk, TSdk> = {
	[action in RunnerActions]: RunnerResult<TCdk, TSdk>[];
};

const generateEmptyRunnerResults = <TCdk, TSdk>(): RunnerResults<
	TCdk,
	TSdk
> => ({
	[RunnerActions.ADD]: [],
	[RunnerActions.ADD_AS_DEPRECATED]: [],
	[RunnerActions.UPDATE_SET_DEPRECATED]: [],
	[RunnerActions.UPDATE_SET_NOT_DEPRECATED]: [],
	[RunnerActions.REMOVE]: [],
});

export abstract class CdkSdkVersionRunner<TCdk, TSdk> {
	protected constructor(protected readonly identifier: string) {}

	protected abstract getCdkVersions(): DeprecableVersion<TCdk>[];
	protected abstract fetchSdkVersions(): Promise<DeprecableVersion<TSdk>[]>;

	protected abstract stringifyCdkVersion(cdkVersion: TCdk): string;
	protected abstract stringifySdkVersion(sdkVersion: TSdk): string;

	protected abstract compareCdkSdkVersions(cdk: TCdk, sdk: TSdk): boolean;

	protected generateRecord({
		cdkVersion,
		sdkVersion,
	}: RequireAtLeastOne<{ cdkVersion: TCdk; sdkVersion: TSdk }>): RunnerResult<
		TCdk,
		TSdk
	> {
		if (sdkVersion)
			return { sdkVersion, result: this.stringifySdkVersion(sdkVersion) };
		if (cdkVersion)
			return { cdkVersion, result: this.stringifyCdkVersion(cdkVersion) };
		throw new Error("never");
	}

	public async run(): Promise<RunnerResults<TCdk, TSdk>> {
		// Allows to let the SDK request to be sent while we do CPU intensive TS parsing
		const _sdkVersionsPromise = this.fetchSdkVersions();
		const cdkVersions = this.getCdkVersions();
		const sdkVersions = await _sdkVersionsPromise;

		const runnerResults = generateEmptyRunnerResults<TCdk, TSdk>();

		for (const cdkVersion of cdkVersions) {
			const sdkVersion = sdkVersions.find(({ version }) =>
				this.compareCdkSdkVersions(cdkVersion.version, version),
			);

			if (!sdkVersion) {
				if (cdkVersion.isDeprecated) continue;

				runnerResults[RunnerActions.REMOVE].push(
					this.generateRecord({ cdkVersion: cdkVersion.version }),
				);
			} else if (sdkVersion.isDeprecated !== cdkVersion.isDeprecated) {
				runnerResults[
					sdkVersion.isDeprecated
						? RunnerActions.UPDATE_SET_DEPRECATED
						: RunnerActions.UPDATE_SET_NOT_DEPRECATED
				].push(this.generateRecord({ cdkVersion: cdkVersion.version }));
			}
		}

		for (const sdkVersion of sdkVersions) {
			const cdkVersion = cdkVersions.find(({ version }) =>
				this.compareCdkSdkVersions(version, sdkVersion.version),
			);

			if (!cdkVersion) {
				runnerResults[
					sdkVersion.isDeprecated
						? RunnerActions.ADD_AS_DEPRECATED
						: RunnerActions.ADD
				].push(this.generateRecord({ sdkVersion: sdkVersion.version }));
			}
		}

		return runnerResults;
	}

	public consoleOutputResults(runnerResults: RunnerResults<TCdk, TSdk>) {
		for (const [action, results] of Object.entries(runnerResults) as Entries<
			RunnerResults<TCdk, TSdk>
		>) {
			results
				.sort()
				.map(({ result }) =>
					console.log(runnerActionConsoleTaggedTemplate[action](result)),
				);
		}
	}
}
