#!/usr/bin/env node
import {
	BedrockRunner,
	Ec2InstanceClassRunner,
	Ec2InstanceSizeRunner,
	Ec2WindowsVersionRunner,
	KafkaRunner,
	LinuxArmBuildImageRunner,
	LinuxArmLambdaBuildImageRunner,
	LinuxBuildImageRunner,
	LinuxLambdaBuildImageRunner,
	OpenSearchRunner,
	RdsAuroraMysqlEngineRunner,
	RdsAuroraPostgresEngineRunner,
	RdsMariaDbEngineRunner,
	RdsMySqlEngineRunner,
	RdsOracleEngineRunner,
	RdsPostgresEngineRunner,
	RdsSqlServerEngineRunner,
	SyntheticsRunner,
	WindowsBuildImageRunner,
	type CdkSdkVersionRunner,
} from "cdk-sdk-versions-runner";
import { Spinner } from "cli-spinner";
import type { Class, Entries, Entry } from "type-fest";
import yargs from "yargs";
import { version } from "../package.json";

type Runner = Class<CdkSdkVersionRunner<unknown, unknown>>;

const ALL_RUNNERS = "all";
const runners: Record<string, Runner[]> = {
	bedrock: [BedrockRunner],
	kafka: [KafkaRunner],
	opensearch: [OpenSearchRunner],
	synthetics: [SyntheticsRunner],
	codebuild: [
		WindowsBuildImageRunner,
		LinuxBuildImageRunner,
		LinuxArmBuildImageRunner,
		LinuxLambdaBuildImageRunner,
		LinuxArmLambdaBuildImageRunner,
	],
	rds: [
		RdsMySqlEngineRunner,
		RdsMariaDbEngineRunner,
		RdsPostgresEngineRunner,
		RdsOracleEngineRunner,
		RdsSqlServerEngineRunner,
		RdsAuroraMysqlEngineRunner,
		RdsAuroraPostgresEngineRunner,
	],
	ec2: [Ec2InstanceClassRunner, Ec2InstanceSizeRunner, Ec2WindowsVersionRunner],
};

type RunnerKey = keyof typeof runners;
const runnerKeys = Object.keys(runners) as RunnerKey[];

enum Command {
	RUN = "run",
}

enum Option {
	RUNNNER = "runner",
	ONE_LINE = "one-line",
}

interface YargsResult {
	$0: "cdk-sdk-versions";
	_: Command[];
	[Option.RUNNNER]: string;
	[Option.ONE_LINE]: boolean;
}

const cli = yargs(process.argv.slice(2))
	.scriptName("cdk-sdk-versions")
	.demand(
		1,
		"You must provide a valid command, use --help to see available commands.",
	)
	.version(version)
	.alias("v", "version")
	.help("h")
	.alias("h", "help")
	.showHelpOnFail(false);

cli.command(`${Command.RUN} [${Option.RUNNNER}]`, "Run a runner", (yargs) => {
	yargs
		.positional(Option.RUNNNER, {
			type: "string",
			default: ALL_RUNNERS,
			defaultDescription: "Run all runners",
			describe: "Runner",
			choices: [ALL_RUNNERS, ...runnerKeys],
		})
		.option(Option.ONE_LINE, {
			type: "boolean",
			default: false,
			describe: "Output results in a single line",
		})
		.array(Option.RUNNNER);
});

const argv = cli.parse() as unknown as YargsResult;
if (!argv._.includes(Command.RUN)) {
	process.exit(1);
}

const run = async (argv: YargsResult) => {
	const oneLine = argv[Option.ONE_LINE];

	const selectedRunnerKeys =
		argv[Option.RUNNNER] === ALL_RUNNERS
			? runnerKeys
			: [argv[Option.RUNNNER] as RunnerKey];

	const selectedRunners = Object.fromEntries(
		selectedRunnerKeys.map<Entry<Record<RunnerKey, Runner[]>>>((key) => [
			key,
			runners[key],
		]),
	);

	runnersExec: for (const [runnerKey, runnerClasses] of Object.entries(
		selectedRunners,
	) as Entries<typeof selectedRunners>) {
		for (const runnerClass of runnerClasses) {
			const spinner = new Spinner(`Running ${runnerClass.name}... %s`);
			spinner.setSpinnerString("|/-\\");
			spinner.start();

			try {
				const runner = new runnerClass();
				const results = await runner.run();

				spinner.stop(true);
				console.log(`${runnerClass.name} results:\n`);
				runner.consoleOutputResults(results, { oneLine });
				console.log("\n");
			} catch (error) {
				spinner.stop(true);

				console.error(`${runnerClass.name} error:\n`, error);
				break runnersExec;
			}
		}
	}
};

void run(argv);
