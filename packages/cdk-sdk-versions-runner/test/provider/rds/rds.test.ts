import {
	DescribeDBEngineVersionsCommand,
	RDSClient,
} from "@aws-sdk/client-rds";
import {
	AuroraMysqlEngineVersion,
	MysqlEngineVersion,
	PostgresEngineVersion,
} from "aws-cdk-lib/aws-rds";
import { mockClient } from "aws-sdk-client-mock";
import "aws-sdk-client-mock-jest";
import { join } from "path";
import { getSdkMysqlEngineVersions } from "../../../src/provider/rds";
import {
	CDK_LIB_CLUSTER_ENGINE_PATH,
	CDK_LIB_INSTANCE_ENGINE_PATH,
	getCDKClusterEngineVersions,
	getCDKInstanceEngineVersions,
} from "../../../src/util/provider/rds";

const rdsMock = mockClient(RDSClient);
beforeEach(() => {
	rdsMock.reset();
});

describe("SDK", () => {
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
		expect(rdsMock).toHaveReceivedCommandTimes(
			DescribeDBEngineVersionsCommand,
			1,
		);
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

describe("getCDKInstanceEngineVersions", () => {
	it("should extract getCDKInstanceEngineVersions from .ts", () => {
		const spy = jest
			.spyOn(CDK_LIB_INSTANCE_ENGINE_PATH, "auto", "get")
			.mockReturnValue(join(__dirname, "./mocked-instance-engine.ts"));

		const cdkEngineVersions = getCDKInstanceEngineVersions();
		expect(spy).toHaveBeenCalled();

		expect(cdkEngineVersions).toHaveLength(2);

		const [first, second] = cdkEngineVersions;
		expect(first.engineVersion).toEqual(PostgresEngineVersion.VER_9_6_24);
		expect(first.isDeprecated).toBe(true);

		expect(second.engineVersion).toEqual(PostgresEngineVersion.VER_12_11);
		expect(second.isDeprecated).toBe(false);
	});

	it("should extract getCDKInstanceEngineVersions from .d.ts", () => {
		const spy = jest
			.spyOn(CDK_LIB_INSTANCE_ENGINE_PATH, "auto", "get")
			.mockReturnValue(join(__dirname, "./mocked-instance-engine.d.ts"));

		const cdkEngineVersions = getCDKInstanceEngineVersions();
		expect(spy).toHaveBeenCalled();

		expect(cdkEngineVersions).toHaveLength(2);

		const [first, second] = cdkEngineVersions;
		expect(first.engineVersion).toEqual(PostgresEngineVersion.VER_9_6_24);
		expect(first.isDeprecated).toBe(true);

		expect(second.engineVersion).toEqual(PostgresEngineVersion.VER_12_11);
		expect(second.isDeprecated).toBe(false);
	});
});

describe("getCDKClusterEngineVersions", () => {
	it("should extract getCDKClusterEngineVersions from .ts", () => {
		const spy = jest
			.spyOn(CDK_LIB_CLUSTER_ENGINE_PATH, "auto", "get")
			.mockReturnValue(join(__dirname, "./mocked-cluster-engine.ts"));

		const cdkEngineVersions = getCDKClusterEngineVersions();
		expect(spy).toHaveBeenCalled();

		expect(cdkEngineVersions).toHaveLength(2);

		const [first, second] = cdkEngineVersions;
		expect(first.engineVersion).toEqual(AuroraMysqlEngineVersion.VER_2_10_3);
		expect(first.isDeprecated).toBe(true);

		expect(second.engineVersion).toEqual(AuroraMysqlEngineVersion.VER_2_11_1);
		expect(second.isDeprecated).toBe(false);
	});

	it("should extract getCDKClusterEngineVersions from .d.ts", () => {
		const spy = jest
			.spyOn(CDK_LIB_CLUSTER_ENGINE_PATH, "auto", "get")
			.mockReturnValue(join(__dirname, "./mocked-cluster-engine.d.ts"));

		const cdkEngineVersions = getCDKClusterEngineVersions();
		expect(spy).toHaveBeenCalled();

		expect(cdkEngineVersions).toHaveLength(2);

		const [first, second] = cdkEngineVersions;
		expect(first.engineVersion).toEqual(AuroraMysqlEngineVersion.VER_2_10_3);
		expect(first.isDeprecated).toBe(true);

		expect(second.engineVersion).toEqual(AuroraMysqlEngineVersion.VER_2_11_1);
		expect(second.isDeprecated).toBe(false);
	});
});
