export default [
	{
		ignores: ["node_modules/**", "dist/**", "out/**"],
	},
	{
		languageOptions: {
			sourceType: "module",
			ecmaVersion: "latest",
			globals: {
				// Node.js globals
				__dirname: "readonly",
				__filename: "readonly",
				exports: "readonly",
				module: "readonly",
				require: "readonly",
				process: "readonly",
				Buffer: "readonly"
			}
		},
		rules: {
			"indent": ["error", "tab"],
			"linebreak-style": ["error", "unix"],
			"quotes": ["error", "double"],
			"semi": ["error", "always"]
		}
	}
];
