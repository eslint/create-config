import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		coverage: {
			include: ["lib/**/*"],
			reporter: ["text", "html"],
		},
	},
});
