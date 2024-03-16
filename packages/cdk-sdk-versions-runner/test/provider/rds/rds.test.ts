import {
	RdsAuroraMysqlEngineRunner,
	RdsMySqlEngineRunner,
	RdsPostgresEngineRunner,
} from "@app/provider";
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
import { join } from "node:path";

const rdsMock = mockClient(RDSClient);
beforeEach(() => {
	rdsMock.reset();
});

// TODO test caching with isCacheEnabled

describe("SDK", () => {
	class ProxyRdsMySqlEngineRunner extends RdsMySqlEngineRunner {
		get isCacheEnabled() {
			return false;
		}
		public async fetchSdkVersions() {
			return super.fetchSdkVersions();
		}
	}

	it.only("getMysqlEngineVersions", async () => {
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

		const runner = new ProxyRdsMySqlEngineRunner();
		const versions = await runner.fetchSdkVersions();
		expect(rdsMock).toHaveReceivedCommandTimes(
			DescribeDBEngineVersionsCommand,
			1,
		);
		expect(versions).toHaveLength(2);

		const [first, second] = versions;
		expect(first.version).toEqual(MysqlEngineVersion.of("5.5.46", "5.5"));
		expect(first.isDeprecated).toBe(true);

		expect(second.version).toEqual(MysqlEngineVersion.of("5.7.37", "5.7"));
		expect(second.isDeprecated).toBe(false);
	});
});

describe("getCDKInstanceEngineVersions", () => {
	class ProxyRdsPostgresEngineRunner extends RdsPostgresEngineRunner {
		get isCacheEnabled() {
			return false;
		}
		public async fetchSdkVersions() {
			return super.fetchSdkVersions();
		}
		public async generateCdkVersions() {
			return super.generateCdkVersions();
		}
	}

	it("should extract getCDKInstanceEngineVersions from .ts", async () => {
		const spy = jest
			.spyOn(ProxyRdsPostgresEngineRunner.instanceEnginePath, "auto", "get")
			.mockReturnValue(join(__dirname, "./mocked-instance-engine.ts"));

		const runner = new ProxyRdsPostgresEngineRunner();
		const cdkEngineVersions = await runner.generateCdkVersions();
		expect(spy).toHaveBeenCalled();

		expect(cdkEngineVersions).toHaveLength(2);

		const [first, second] = cdkEngineVersions;
		expect(first.version).toEqual(PostgresEngineVersion.VER_9_6_24);
		expect(first.isDeprecated).toBe(true);

		expect(second.version).toEqual(PostgresEngineVersion.VER_12_11);
		expect(second.isDeprecated).toBe(false);
	});

	it("should extract getCDKInstanceEngineVersions from .d.ts", async () => {
		const spy = jest
			.spyOn(ProxyRdsPostgresEngineRunner.instanceEnginePath, "auto", "get")
			.mockReturnValue(join(__dirname, "./mocked-instance-engine.d.ts"));

		const runner = new ProxyRdsPostgresEngineRunner();
		const cdkEngineVersions = await runner.generateCdkVersions();
		expect(spy).toHaveBeenCalled();

		expect(cdkEngineVersions).toHaveLength(2);

		const [first, second] = cdkEngineVersions;
		expect(first.version).toEqual(PostgresEngineVersion.VER_9_6_24);
		expect(first.isDeprecated).toBe(true);

		expect(second.version).toEqual(PostgresEngineVersion.VER_12_11);
		expect(second.isDeprecated).toBe(false);
	});
});

describe("getCDKClusterEngineVersions", () => {
	class ProxyRdsAuroraMysqlEngineRunner extends RdsAuroraMysqlEngineRunner {
		get isCacheEnabled() {
			return false;
		}
		public async fetchSdkVersions() {
			return super.fetchSdkVersions();
		}
		public async generateCdkVersions() {
			return super.generateCdkVersions();
		}
	}

	it("should extract getCDKClusterEngineVersions from .ts", async () => {
		const spy = jest
			.spyOn(ProxyRdsAuroraMysqlEngineRunner.clusterEnginePath, "auto", "get")
			.mockReturnValue(join(__dirname, "./mocked-cluster-engine.ts"));
		const runner = new ProxyRdsAuroraMysqlEngineRunner();
		const cdkEngineVersions = await runner.generateCdkVersions();
		expect(spy).toHaveBeenCalled();

		expect(cdkEngineVersions).toHaveLength(2);

		const [first, second] = cdkEngineVersions;
		expect(first.version).toEqual(AuroraMysqlEngineVersion.VER_2_10_3);
		expect(first.isDeprecated).toBe(true);

		expect(second.version).toEqual(AuroraMysqlEngineVersion.VER_2_11_1);
		expect(second.isDeprecated).toBe(false);
	});

	it("should extract getCDKClusterEngineVersions from .d.ts", async () => {
		const spy = jest
			.spyOn(ProxyRdsAuroraMysqlEngineRunner.clusterEnginePath, "auto", "get")
			.mockReturnValue(join(__dirname, "./mocked-cluster-engine.d.ts"));
		const runner = new ProxyRdsAuroraMysqlEngineRunner();
		const cdkEngineVersions = await runner.generateCdkVersions();
		expect(spy).toHaveBeenCalled();

		expect(cdkEngineVersions).toHaveLength(2);

		const [first, second] = cdkEngineVersions;
		expect(first.version).toEqual(AuroraMysqlEngineVersion.VER_2_10_3);
		expect(first.isDeprecated).toBe(true);

		expect(second.version).toEqual(AuroraMysqlEngineVersion.VER_2_11_1);
		expect(second.isDeprecated).toBe(false);
	});
});
