module.exports = {
	transform: {
		"^.+\\.(tsx?|jsx?)$": "esbuild-jest",
	},
	transformIgnorePatterns: ["node_modules/(?!(chalk)/)"],
};
