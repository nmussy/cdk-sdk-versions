import { FoundationModelIdentifier } from "aws-cdk-lib/aws-bedrock";
import type { DeprecableVersion } from "../../runner";
import { CdkLibPath } from "../cdk";
import { getStaticFieldComments } from "../tsdoc";

export const CDK_BEDROCK_FOUNDATION_MODEL_PATH = new CdkLibPath(
	"aws-bedrock/lib/foundation-model.d.ts",
);

const bedrockConstructorRegex =
	/new FoundationModelIdentifier\('(?<modelId>[\w.:-]+)'\)/;

export const getCDKFoundationModelIdentifiers = () => {
	const bedrockModels: DeprecableVersion<FoundationModelIdentifier>[] = [];

	for (const { fieldName, fieldValue, isDeprecated } of getStaticFieldComments(
		CDK_BEDROCK_FOUNDATION_MODEL_PATH.auto,
	)) {
		let version: FoundationModelIdentifier;
		if (fieldName in FoundationModelIdentifier) {
			version = FoundationModelIdentifier[
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
			version = new FoundationModelIdentifier(modelId);
		}

		bedrockModels.push({
			version,
			isDeprecated,
		});
	}

	return bedrockModels;
};
