import {
	BedrockClient,
	FoundationModelLifecycleStatus,
	ListFoundationModelsCommand,
	type FoundationModelSummary,
} from "@aws-sdk/client-bedrock";
import type { FoundationModelIdentifier } from "aws-cdk-lib/aws-bedrock";
import { CdkSdkVersionRunner } from "../runner";
import { getCDKFoundationModelIdentifiers } from "../util/provider/bedrock";

const client = new BedrockClient({});

const __MISSING_MODEL_ID__ = "__MISSING_MODEL_ID__";

export class BedrockRunner extends CdkSdkVersionRunner<
	FoundationModelIdentifier,
	FoundationModelSummary
> {
	constructor() {
		super("Bedrock");
	}

	protected getCdkVersions() {
		return getCDKFoundationModelIdentifiers();
	}
	protected async fetchSdkVersions() {
		const { modelSummaries = [] } = await client.send(
			new ListFoundationModelsCommand({}),
		);

		return modelSummaries.map((version) => ({
			version,
			isDeprecated:
				version.modelLifecycle?.status !==
				FoundationModelLifecycleStatus.ACTIVE,
		}));
	}

	protected stringifyCdkVersion({ modelId }: FoundationModelIdentifier) {
		return modelId;
	}

	protected stringifySdkVersion({ modelId }: FoundationModelSummary) {
		return modelId ?? __MISSING_MODEL_ID__;
	}

	protected compareCdkSdkVersions(
		cdk: FoundationModelIdentifier,
		sdk: FoundationModelSummary,
	) {
		return cdk.modelId === sdk.modelId;
	}
}
