import {
	DescribeDBEngineVersionsCommand,
	RDSClient,
} from "@aws-sdk/client-rds";
import { MysqlEngineVersion, PostgresEngineVersion } from "aws-cdk-lib/aws-rds";
import { mockClient } from "aws-sdk-client-mock";
import "aws-sdk-client-mock-jest";
import { join } from "path";
import { getSdkMysqlEngineVersions } from "../../src/provider/rds";
import {
	CDK_LIB_INTERNALS_PATH,
	getCDKEngineVersions,
} from "../../src/util/provider/rds";

const rdsMock = mockClient(RDSClient);

beforeEach(() => {
	rdsMock.reset();
});

describe("SDK", () => {
	afterEach(() => {
		expect(rdsMock).toHaveReceivedCommandTimes(
			DescribeDBEngineVersionsCommand,
			1,
		);
	});

	it("getMysqlEngineVersions", async () => {
		rdsMock.on(DescribeDBEngineVersionsCommand).resolves({
			DBEngineVersions: [
				{
					Engine: "mysql",
					EngineVersion: "5.5.46",
					Status: "deprecated",
					MajorEngineVersion: "5.5",
				},
				{
					Engine: "mysql",
					EngineVersion: "5.7.37",
					Status: "available",
					MajorEngineVersion: "5.7",
				},
			],
		});

		const versions = await getSdkMysqlEngineVersions();
		expect(versions).toHaveLength(2);

		const [first, second] = versions;
		expect(first.engineVersion).toEqual(MysqlEngineVersion.of("5.5.46", "5.5"));
		expect(first.isDeprecated).toBe(true);

		expect(second.engineVersion).toEqual(
			MysqlEngineVersion.of("5.7.37", "5.7"),
		);
		expect(second.isDeprecated).toBe(false);
	});
});

describe("CDK", () => {
	const spy = jest
		.spyOn(CDK_LIB_INTERNALS_PATH, "rdsInstanceEngineDeclaration", "get")
		.mockReturnValue(join(__dirname, "./mocked-instance-engine.d.ts"));

	it("getCDKEngineVersions", () => {
		const cdkEngineVersions = getCDKEngineVersions();
		expect(spy).toHaveBeenCalled();

		expect(cdkEngineVersions).toHaveLength(2);

		const [first, second] = cdkEngineVersions;
		expect(first.engineVersion).toEqual(PostgresEngineVersion.VER_9_6_24);
		expect(first.isDeprecated).toBe(true);

		expect(second.engineVersion).toEqual(PostgresEngineVersion.VER_12_11);
		expect(second.isDeprecated).toBe(false);
	});
});
