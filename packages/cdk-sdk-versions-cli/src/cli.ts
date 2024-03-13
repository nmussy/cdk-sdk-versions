#!/usr/bin/env node
import { runBedrock } from "cdk-sdk-versions-runner";
import yargs from "yargs";

console.log(runBedrock());

const argv = yargs(process.argv.slice(2))
	.options({
		a: { type: "boolean", default: false },
		b: { type: "string", demandOption: true },
		c: { type: "number", alias: "chill" },
		d: { type: "array" },
		e: { type: "count" },
		f: { choices: ["1", "2", "3"] },
	})
	.parse();

yargs.showHelp();
