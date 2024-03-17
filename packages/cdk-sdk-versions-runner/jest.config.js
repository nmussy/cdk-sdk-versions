const hq = require("alias-hq");

hq.load("./test/tsconfig.json");

module.exports = {
	transform: {
		"\\.[jt]sx?$": [
			"esbuild-jest",
			{
				loaders: {
					".spec.js": "jsx",
					".js": "jsx",
				},
			},
		],
	},
	transformIgnorePatterns: ["node_modules/(?!(chalk)/)"],
	moduleNameMapper: hq.get("jest"),

	testPathIgnorePatterns: ["/node_modules/", "/dist/", "/types/"],
	moduleFileExtensions: ["ts", "js"],
};
