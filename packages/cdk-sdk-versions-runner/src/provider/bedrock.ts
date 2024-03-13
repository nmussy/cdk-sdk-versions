import {
	BedrockClient,
	FoundationModelLifecycleStatus,
	ListFoundationModelsCommand,
} from "@aws-sdk/client-bedrock";
import { CONSOLE_SYMBOLS } from "../util";
import { getCDKFoundationModelIdentifiers } from "../util/provider/bedrock";

const client = new BedrockClient({});
export const getFoundationModels = async () => {
	const models = await client.send(new ListFoundationModelsCommand({}));

	return models.modelSummaries ?? [];
};

export const runBedrock = async () => {
	const sdkModels = await getFoundationModels();
	const cdkModels = getCDKFoundationModelIdentifiers();

	for (const cdkModel of cdkModels) {
		const sdkModel = sdkModels.find(
			({ modelId }) => modelId === cdkModel.model.modelId,
		);

		const isDeprecated =
			sdkModel?.modelLifecycle?.status !==
			FoundationModelLifecycleStatus.ACTIVE;

		if (!sdkModel) {
			if (cdkModel.isDeprecated) continue;

			console.log(CONSOLE_SYMBOLS.DELETE, cdkModel.model.modelId);
		} else if (!cdkModel.isDeprecated && isDeprecated) {
			console.log(
				CONSOLE_SYMBOLS.UPDATE,
				cdkModel.model.modelId,
				"@deprecated",
			);
		} else if (cdkModel.isDeprecated && !isDeprecated) {
			console.log(
				CONSOLE_SYMBOLS.UPDATE,
				cdkModel.model.modelId,
				"not @deprecated",
			);
		}
	}

	for (const sdkModel of sdkModels) {
		const cdkModel = cdkModels.find(
			({ model: { modelId } }) => modelId === sdkModel.modelId,
		);

		if (!cdkModel) {
			const isDeprecated =
				sdkModel?.modelLifecycle?.status !==
				FoundationModelLifecycleStatus.ACTIVE;

			console.log(
				CONSOLE_SYMBOLS.ADD,
				sdkModel.modelId,
				isDeprecated ? "@deprecated" : "",
			);
		}
	}
};

if (process.env.NODE_ENV !== "test") void runBedrock();
