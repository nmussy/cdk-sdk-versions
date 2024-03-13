import { dirname, join, resolve } from "node:path";

const PROJECT_ROOT_PATH = join(__dirname, "../../../..");

export class CdkPath {
	protected moduleName = "aws-cdk";
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
		return join(
			PROJECT_ROOT_PATH,
			"..",
			"aws-cdk",
			this.moduleName !== "aws-cdk" ? `packages/${this.moduleName}` : "",
			// Prefer .ts over .d.ts to skip build step
			this.filePath.replace(/\.d\.ts$/, ".ts"),
		);
	}

	get dependency() {
		return resolve(
			dirname(require.resolve(this.moduleName)),
			this.moduleName === "aws-cdk" ? "aws-cdk" : "",
			this.filePath,
		);
	}
}

export class CdkModulePath extends CdkPath {
	constructor(moduleName: string, filePath: string) {
		super(filePath);
		this.moduleName = moduleName;
	}
}

export class CdkLibPath extends CdkPath {
	get localClone() {
		return join(
			PROJECT_ROOT_PATH,
			"..",
			"aws-cdk/packages/aws-cdk-lib",
			// Prefer .ts over .d.ts to skip build step
			this.filePath.replace(/\.d\.ts$/, ".ts"),
		);
	}

	get dependency() {
		return resolve(dirname(require.resolve("aws-cdk-lib")), this.filePath);
	}
}
