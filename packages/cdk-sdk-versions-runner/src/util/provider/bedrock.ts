import { FoundationModelIdentifier } from "aws-cdk-lib/aws-bedrock";
import { CdkLibPath } from "../cdk";
import { getStaticFieldComments } from "../tsdoc";

export const CDK_BEDROCK_FOUNDATION_MODEL_PATH = new CdkLibPath(
	"aws-bedrock/lib/foundation-model.d.ts",
);
export interface DeprecableFoundationModelIdentifier {
	model: FoundationModelIdentifier;
	isDeprecated: boolean;
}

const bedrockConstructorRegex =
	/new FoundationModelIdentifier\('(?<modelId>[\w.:-]+)'\)/;

export const getCDKFoundationModelIdentifiers = () => {
	const bedrockModels: DeprecableFoundationModelIdentifier[] = [];

	for (const { fieldName, fieldValue, isDeprecated } of getStaticFieldComments(
		CDK_BEDROCK_FOUNDATION_MODEL_PATH.auto,
	)) {
		let model: FoundationModelIdentifier;
		if (fieldName in FoundationModelIdentifier) {
			model = FoundationModelIdentifier[
				fieldName as keyof typeof FoundationModelIdentifier
			] as FoundationModelIdentifier;
		} else {
			const match = fieldValue.match(bedrockConstructorRegex);
			if (!match?.groups) throw new Error(`Unknown modelId: ${fieldValue}`);
			const {
				groups: { modelId },
			} = match;
			console.warn(
				`Unknown modelId: ${fieldName}, replacing with new FoundationModelIdentifier("${modelId}")`,
			);
			model = new FoundationModelIdentifier(modelId);
		}

		bedrockModels.push({
			model,
			isDeprecated,
		});
	}

	return bedrockModels;
};
