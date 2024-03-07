import { Runtime as SDKRuntime } from "@aws-sdk/client-lambda";
import { Runtime as CDKRuntime } from "aws-cdk-lib/aws-lambda";

// TODO create functions for each runtime, SDK check if they are deprecated

export const lambdaRuntimes = Object.entries(SDKRuntime);

console.log(CDKRuntime);
