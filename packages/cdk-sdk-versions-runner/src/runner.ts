import type { Entries, RequireAtLeastOne, RequireExactlyOne } from "type-fest";
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

const ignoredActions: RunnerActions[] = [RunnerActions.ADD_AS_DEPRECATED];

type RunnerResult<TCdk, TSdk> = RequireAtLeastOne<
	{
		result: string;
		cdkVersion?: TCdk;
		sdkVersion?: TSdk;
	},
	"cdkVersion" | "sdkVersion"
>;

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

export enum VersionStorageType {
	ClassWithStaticMembers = "ClassWithStaticMembers",
	Enum = "Enum",
}

export interface BaseCodeGenerationConfiguration {
	storageType: VersionStorageType;
}

export interface ClassCodeGenerationConfiguration
	extends BaseCodeGenerationConfiguration {
	storageType: VersionStorageType.ClassWithStaticMembers;
	className: string;
	factoryMethod?: string;
}

export interface EnumCodeGenerationConfiguration
	extends BaseCodeGenerationConfiguration {
	storageType: VersionStorageType.Enum;
	enumName: string;
}

export type CodeGenerationConfiguration =
	| ClassCodeGenerationConfiguration
	| EnumCodeGenerationConfiguration;

export interface ConsoleOutputOptions {
	oneLine?: boolean;
}

export abstract class CdkSdkVersionRunner<TCdk, TSdk> {
	protected static readonly ARGUMENT_SEPARATOR = "###";
	protected static generateArguments(versionValue: string) {
		return versionValue
			.split(CdkSdkVersionRunner.ARGUMENT_SEPARATOR)
			.map((arg) => `'${arg}'`)
			.join(", ");
	}

	// Prevent performing needless SDK requests/TypeScript parsing
	// by preventing multiple instances of the same runner
	// Each runner is then responsible for its own caching scheme
	// private static singletons: CdkSdkVersionRunner<unknown, unknown>[] = [];

	protected constructor(
		protected readonly identifier: string,
		protected readonly codeGenerationConfiguration: CodeGenerationConfiguration,
	) {
		/* if (process.env.NODE_ENV === "test") return;

		if (
			CdkSdkVersionRunner.singletons.find(
				(runner) => runner instanceof this.constructor,
			)
		)
			throw new Error(`Should not create multiple instances of ${identifier}`);
		CdkSdkVersionRunner.singletons.push(this); */
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

	protected async runWithParams(
		cdkVersions: DeprecableVersion<TCdk>[],
		sdkVersions: DeprecableVersion<TSdk>[],
	): Promise<RunnerResults<TCdk, TSdk>> {
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

	public async run(): Promise<RunnerResults<TCdk, TSdk>> {
		const [cdkVersions, sdkVersions] = await Promise.all([
			this.generateCdkVersions(),
			this.fetchSdkVersions(),
		]);

		return this.runWithParams(cdkVersions, sdkVersions);
	}

	protected generateCodeResultFromCdkVersion(
		result: RunnerResult<TCdk, TSdk>,
	): string {
		if (!result.cdkVersion && !result.sdkVersion) throw new Error("never");

		const versionValue = result.cdkVersion
			? this.getCdkVersionId(result.cdkVersion as TCdk)
			: this.getSdkVersionId(result.sdkVersion as TSdk);

		const versionArgs = CdkSdkVersionRunner.generateArguments(versionValue);

		const { storageType } = this.codeGenerationConfiguration;
		if (storageType === VersionStorageType.ClassWithStaticMembers) {
			const { className, factoryMethod } = this.codeGenerationConfiguration;

			if (!factoryMethod) return `new ${className}(${versionArgs});`;

			return `${className}.${factoryMethod}(${versionArgs});`;
		}

		if (storageType === VersionStorageType.Enum) {
			// const { enumName } = this.codeGenerationConfiguration;
			return `${versionValue
				.toLocaleUpperCase()
				.replace(/[-.]/g, "_")} = ${versionArgs},`;
		}

		throw new Error("not implemented");
	}

	public consoleOutputResults(
		runnerResults: RunnerResults<TCdk, TSdk>,
		{ oneLine = false }: ConsoleOutputOptions = {},
	) {
		for (const [action, results] of Object.entries(runnerResults) as Entries<
			RunnerResults<TCdk, TSdk>
		>) {
			if (ignoredActions.includes(action)) continue;

			results
				.sort(({ result: a }, { result: b }) => a.localeCompare(b))
				.map((result) => {
					const versionArgs = CdkSdkVersionRunner.generateArguments(
						result.result,
					);

					console.log(runnerActionConsoleTaggedTemplate[action](versionArgs));
					if (oneLine) return;

					console.log(this.generateCodeResultFromCdkVersion(result));
				});
		}
	}
}
