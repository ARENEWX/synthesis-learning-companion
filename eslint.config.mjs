import obsidianmd from "eslint-plugin-obsidianmd";

export default [
  { ignores: ["main.js", "node_modules", "test-vault", "coverage", "esbuild.config.mjs", "version-bump.mjs"] },
  ...obsidianmd.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["eslint.config.*"]
        }
      }
    },
    rules: {
      "obsidianmd/ui/sentence-case": ["warn", {
        brands: ["Synthesis", "OpenAI", "Markdown", "SecretStorage"],
        acronyms: ["AI", "API", "BYOK", "URL", "IPA"]
      }]
    }
  }
];
