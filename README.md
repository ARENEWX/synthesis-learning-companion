# Synthesis Learning Companion

Synthesis Learning Companion turns an Obsidian Markdown note into a focused reading desk: select a passage, mark it, ask an AI tutor in the right sidebar, hear English aloud, and save the result as a durable note or learning card.

> The plugin is currently preparing for its first Community plugins submission. Manual installation is available from the release assets once the first public release is published.

## What it does

- Shows a compact toolbar after selecting text in the Markdown editor.
- Adds four-color Markdown highlights and underlines that remain readable without the plugin.
- Explains a selection in a dedicated right sidebar while preserving follow-up conversation context.
- Provides an English-teacher mode grounded in the selected word, sentence, and paragraph.
- Reads a selected passage or the complete current note with two user-configured English system voice slots.
- Searches local Markdown notes when **Vault search** is selected and adds the best matching excerpts to the request.
- Saves an explanation to a standalone Markdown note or appends it to the source note.
- Saves either a vocabulary card or a terminology card using one shared Markdown card model.

## Typical workflow

1. Select a word, technical term, sentence, or paragraph.
2. Choose a highlight/underline color, **解释**, **英语**, or one of the reading voices.
3. Continue asking questions in the sidebar. Choose Selection, Current note, or Vault search as the context scope.
4. Save the latest answer as a note, append it to the source, or create a vocabulary/term card.

Cards are ordinary Markdown files with source links, the original reading context, the learner's question, the tutor explanation, and a `status` property that can later be changed from `learning` to `mastered`.

## OpenAI and compatible providers

Open **Settings → Synthesis Learning Companion** and enter:

- your API key;
- API base URL (the default is `https://api.openai.com/v1`);
- model ID;
- **OpenAI Responses API**, or **Chat Completions compatible** for another provider.

The API key is stored with Obsidian's `SecretStorage`; it is not saved in plugin data or in the vault. This is a bring-your-own-key plugin, so requests may incur charges from the provider you configure.

### Network and privacy disclosure

The plugin has no account, analytics, telemetry, advertising, or plugin-operated server. A network request happens only after the learner explicitly sends a tutor question. Depending on the selected scope, the request contains:

- the selected text, containing sentence, and containing paragraph;
- source note title/path/line number;
- the current note when **Current note** is chosen;
- locally retrieved excerpts when **Vault search** is chosen;
- up to eight recent turns from the current sidebar conversation;
- the learner's question.

OpenAI Responses requests set `store: false`. Your configured provider still processes the request under its own terms and privacy policy. Highlights, underlines, system-voice reading, and existing Markdown cards do not require an AI connection.

## Reading voices

Reading aloud uses the Web Speech API and English voices installed on the device. The settings expose two user-defined slots named **Female voice** and **Male voice**. These labels are convenient presets chosen by the learner; the plugin does not infer a person's gender from voice metadata.

Long notes are split at sentence boundaries so complete-note reading is more reliable. Voice availability and quality depend on the operating system. AI-generated cloud speech is not included in version 0.1.0.

## Installation for development

Requirements: Node.js 20 or newer and Obsidian 1.11.4 or newer.

```bash
npm install
npm test
npm run build
```

Copy `manifest.json`, `main.js`, and `styles.css` into:

```text
<your-vault>/.obsidian/plugins/synthesis-learning-companion/
```

Then reload Obsidian and enable **Synthesis Learning Companion** under Community plugins.

## Release checklist

1. Run `npm test`, `npm run lint`, and `npm run build`.
2. Update the package version with `npm version patch`, `minor`, or `major`.
3. Commit `manifest.json`, `versions.json`, and `package.json`.
4. Push a tag whose name exactly matches the version, for example `0.1.0`.
5. Attach `manifest.json`, `main.js`, and `styles.css` to the matching GitHub release.
6. Submit the repository through the Obsidian Community plugins submission form.

## Design and architecture documents

- [Product requirements](docs/requirements.md)
- [Domain model](CONTEXT.md)
- [Markdown as the durable record](docs/adr/0001-markdown-is-the-durable-learning-record.md)
- [Client-side BYOK architecture](docs/adr/0002-use-client-side-byok-without-a-plugin-backend.md)

## License

[MIT](LICENSE)
