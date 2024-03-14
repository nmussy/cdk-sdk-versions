import type { Entries, RequireExactlyOne } from "type-fest";
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
	// Prevent performing needless SDK requests/TypeScript parsing
	// by preventing multiple instances of the same runner
	// Each runner is then responsible for its own caching scheme
	private static singletons: CdkSdkVersionRunner<unknown, unknown>[] = [];

	protected constructor(protected readonly identifier: string) {
		if (
			CdkSdkVersionRunner.singletons.find(
				(runner) => runner instanceof this.constructor,
			)
		)
			throw new Error(`Should not create multiple instances of ${identifier}`);
		CdkSdkVersionRunner.singletons.push(this);
	}

	protected abstract generateCdkVersions(): Promise<DeprecableVersion<TCdk>[]>;
	protected abstract fetchSdkVersions(): Promise<DeprecableVersion<TSdk>[]>;

	protected abstract getCdkVersionId(cdkVersion: TCdk): string;
	protected abstract getSdkVersionId(sdkVersion: TSdk): string;

	protected compareCdkSdkVersions(cdk: TCdk, sdk: TSdk): boolean {
		return this.getCdkVersionId(cdk) === this.getSdkVersionId(sdk);
	}

	protected generateRecord({
		cdkVersion,
		sdkVersion,
	}: RequireExactlyOne<
		{ cdkVersion: TCdk; sdkVersion: TSdk },
		"cdkVersion" | "sdkVersion"
	>): RunnerResult<TCdk, TSdk> {
		if (sdkVersion)
			return { sdkVersion, result: this.getSdkVersionId(sdkVersion) };
		if (cdkVersion)
			return { cdkVersion, result: this.getCdkVersionId(cdkVersion) };
		throw new Error("never");
	}

	public async run(): Promise<RunnerResults<TCdk, TSdk>> {
		const [cdkVersions, sdkVersions] = await Promise.all([
			this.generateCdkVersions(),
			this.fetchSdkVersions(),
		]);

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
