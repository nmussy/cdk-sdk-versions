import {
	BedrockClient,
	FoundationModelLifecycleStatus,
	ListFoundationModelsCommand,
	type FoundationModelSummary,
} from "@aws-sdk/client-bedrock";
import { FoundationModelIdentifier } from "aws-cdk-lib/aws-bedrock";
import { CdkSdkVersionRunner, type DeprecableVersion } from "../runner";
import { CdkLibPath } from "../util/cdk";
import { getStaticFieldComments } from "../util/tsdoc";

export class BedrockRunner extends CdkSdkVersionRunner<
	FoundationModelIdentifier,
	FoundationModelSummary
> {
	private static readonly client = new BedrockClient({});
	private static readonly foundationModelPath = new CdkLibPath(
		"aws-bedrock/lib/foundation-model.d.ts",
	);
	private static readonly foundationModelConstructorRegex =
		/new FoundationModelIdentifier\('(?<modelId>[\w.:-]+)'\)/;

	public static readonly __MISSING_MODEL_ID__ = "__MISSING_MODEL_ID__";

	constructor() {
		super("Bedrock");
	}

	protected async generateCdkVersions() {
		const bedrockModels: DeprecableVersion<FoundationModelIdentifier>[] = [];

		for (const {
			fieldName,
			fieldValue,
			isDeprecated,
		} of getStaticFieldComments(BedrockRunner.foundationModelPath.auto)) {
			let version: FoundationModelIdentifier;
			if (fieldName in FoundationModelIdentifier) {
				version = FoundationModelIdentifier[
					fieldName as keyof typeof FoundationModelIdentifier
				] as FoundationModelIdentifier;
			} else {
				const match = fieldValue.match(
					BedrockRunner.foundationModelConstructorRegex,
				);
				if (!match?.groups) throw new Error(`Unknown modelId: ${fieldValue}`);
				const {
					groups: { modelId },
				} = match;
				console.warn(
					`Unknown modelId: ${fieldName}, replacing with new FoundationModelIdentifier("${modelId}")`,
				);
				version = new FoundationModelIdentifier(modelId);
			}

			bedrockModels.push({ version, isDeprecated });
		}

		return bedrockModels;
	}

	protected async fetchSdkVersions() {
		const { modelSummaries = [] } = await BedrockRunner.client.send(
			new ListFoundationModelsCommand({}),
		);

		return modelSummaries.map((version) => ({
			version,
			isDeprecated:
				version.modelLifecycle?.status !==
				FoundationModelLifecycleStatus.ACTIVE,
		}));
	}

	protected getCdkVersionId({ modelId }: FoundationModelIdentifier) {
		return modelId;
	}

	protected getSdkVersionId({ modelId }: FoundationModelSummary) {
		return modelId ?? BedrockRunner.__MISSING_MODEL_ID__;
	}
}
