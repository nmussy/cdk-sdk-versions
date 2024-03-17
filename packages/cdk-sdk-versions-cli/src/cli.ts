#!/usr/bin/env node
import {
	BedrockRunner,
	KafkaRunner,
	OpenSearchRunner,
	SyntheticsRunner,
} from "cdk-sdk-versions-runner";
import type { Entries } from "type-fest";
import yargs from "yargs";
import { version } from "../package.json";

const ALL_RUNNERS = "all";
const runners = {
	Bedrock: BedrockRunner,
	Kafka: KafkaRunner,
	OpenSearch: OpenSearchRunner,
	Synthetics: SyntheticsRunner,
};

enum Command {
	RUN = "run",
}

interface YargsResult {
	$0: "cdk-sdk-versions";
	_: Command[];
	runner: string;
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
	.alias("h", "help");

cli.command(`${Command.RUN} <runner>`, "Run a runner", (yargs) => {
	yargs.positional("runner", {
		type: "string",
		default: ALL_RUNNERS,
		demandOption: true,
		describe: "Runner",
		choices: [
			ALL_RUNNERS,
			...Object.keys(runners).map((runner) => runner.toLocaleLowerCase()),
		],
	});
});

for (const [name, runner] of Object.entries(runners) as Entries<
	typeof runners
>) {
}

const argv = cli.parse() as unknown as YargsResult;

if (!argv._.includes(Command.RUN)) {
	cli.showHelp();
	process.exit(1);
}

console.log(argv.runner);
