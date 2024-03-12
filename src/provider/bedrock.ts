import {
	BedrockClient,
	FoundationModelLifecycleStatus,
	ListFoundationModelsCommand,
} from "@aws-sdk/client-bedrock";
import { FoundationModelIdentifier } from "aws-cdk-lib/aws-bedrock";

const client = new BedrockClient({});
export const getFoundationModels = async () => {
	const models = await client.send(new ListFoundationModelsCommand({}));

	return models.modelSummaries ?? [];
};

(async () => {
	const models = await getFoundationModels();

	for (const model of models) {
		const isDeprecated =
			model.modelLifecycle?.status !== FoundationModelLifecycleStatus.ACTIVE;
		console.log(
			model.modelId,
			model.modelLifecycle?.status !== FoundationModelLifecycleStatus.ACTIVE,
		);
	}
})();

console.log(FoundationModelIdentifier);
