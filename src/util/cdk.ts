import { dirname, resolve } from "path";

export class CdkPath {
	constructor(protected readonly filePath: string) {}

	get auto() {
		switch (process.env.NODE_ENV) {
			case "test":
				throw new Error("Never, should be mocked");
			case "development":
				return this.localClone;
			default:
				return this.dependency;
		}
	}

	get localClone() {
		if (!require.main) throw new Error("require.main is undefined");

		return resolve(
			dirname(require.main.filename),
			"../../..",
			"aws-cdk",
			// Prefer .ts over .d.ts to skip build step
			this.filePath.replace(/\.d\.ts$/, ".ts"),
		);
	}

	get dependency() {
		return resolve(
			dirname(require.resolve("aws-cdk")),
			"aws-cdk",
			this.filePath,
		);
	}
}

export class CdkLibPath extends CdkPath {
	get localClone() {
		if (!require.main) throw new Error("require.main is undefined");

		return resolve(
			dirname(require.main.filename),
			"../../..",
			"aws-cdk/packages/aws-cdk-lib",
			// Prefer .ts over .d.ts to skip build step
			this.filePath.replace(/\.d\.ts$/, ".ts"),
		);
	}

	get dependency() {
		return resolve(dirname(require.resolve("aws-cdk-lib")), this.filePath);
	}
}
