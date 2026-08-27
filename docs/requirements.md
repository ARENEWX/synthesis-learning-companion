# Synthesis Learning Companion — Product Requirements

## 1. Purpose

Build one Obsidian community plugin that supports the complete learning loop:

> read → select → mark → ask → listen → save → review

The plugin serves technical learners who read English material and research literature inside an Obsidian vault. It combines selection-based annotation, a contextual AI tutor, natural English read-aloud controls, and durable vocabulary/terminology cards without requiring a vendor-hosted plugin backend.

## 2. Product principles

1. **The source remains primary.** Every explanation and card links back to the exact source note and preserves the selected text.
2. **Markdown is the durable record.** Saved explanations and learning cards remain useful when the plugin is disabled.
3. **AI writes only on an explicit action.** Generated content is previewed in the sidebar and saved only when the learner chooses a destination.
4. **Context is visible.** Before an AI request, the learner can see whether it uses the selection, paragraph, full note, or vault search.
5. **Bring your own key.** The learner chooses an OpenAI or OpenAI-compatible endpoint and owns provider billing.
6. **Reading remains calm.** Selection actions are compact; long explanations live in a right sidebar rather than covering the source.

## 3. Primary workflows

### 3.1 Explain a selected passage

1. The learner selects text in a Markdown editing view.
2. A compact toolbar appears near the selection.
3. The learner may apply a colored highlight or underline.
4. The learner chooses **Explain**.
5. The right sidebar opens with the quote, source, reading-context preview, and a loading state.
6. The AI produces a tutor explanation grounded in the selected passage and its containing paragraph.
7. The learner may continue the conversation; recent turns are included in later requests.
8. The learner can save the response as a new note, append it to the source note, or turn the selection and response into a term card.

### 3.2 Learn an English word in context

1. The learner selects an English word or phrase.
2. The learner chooses **English teacher**.
3. The plugin sends the word/phrase, containing sentence or paragraph, source title, and recent tutor turns to the configured model.
4. The response explains the meaning in this context, part of speech, IPA, pronunciation guidance, collocations, one parallel example, and alternative meanings.
5. The learner chooses the configured male or female reading voice to hear the selection, paragraph, or full note.
6. The learner saves the result as a vocabulary card.

### 3.3 Capture a technical term

1. The learner selects a technical or domain-specific term in a paper or note.
2. The learner chooses **Explain** or **Term card**.
3. The AI explains the term's role in the current passage, prerequisites, an example, and common confusion.
4. A term card is created in the configured cards folder with the source quote, context, explanation, source backlink, tags, creation time, and mastery status.

### 3.4 Ask about a note or vault

1. The learner opens the tutor sidebar without a selection.
2. The learner chooses current note or vault as the scope.
3. Current-note mode sends the note content subject to the configured context limit.
4. Vault mode performs local lexical retrieval and sends only the highest-ranked Markdown excerpts.
5. The response identifies the notes used as context.

## 4. Functional requirements

### 4.1 Selection toolbar

- Appears only when a non-empty editor selection exists.
- Offers four reading-mark colors: amber, blue, green, and rose.
- Supports highlight and underline styles.
- Offers Explain, English teacher, Speak, Vocabulary card, and Term card actions.
- Is keyboard dismissible and never traps editor focus.
- Repositions inside the visible viewport.

### 4.2 Right tutor sidebar

- Shows the current source quote and source note.
- Shows the active context scope.
- Supports Markdown-rendered AI output.
- Retains a bounded local conversation history.
- Offers Stop/clear only where supported; failures explain how to recover.
- Provides Save as note, Append to source, Save vocabulary card, and Save term card actions.
- Never applies a generated file change without an explicit click.

### 4.3 AI providers

- First release supports the OpenAI Responses API and configurable OpenAI-compatible JSON endpoints.
- API key is stored in Obsidian secret storage, not in Markdown or synced plugin data.
- Endpoint, model, and maximum context characters are configurable.
- Requests disclose the exact content categories sent to the provider.
- Conversation context is managed locally and requests use provider storage disabled where supported.
- The plugin works without an API key for marks, local voice, and manual cards.

### 4.4 English reading voice

- Speaks the selection, containing paragraph, or full source note.
- Uses system speech synthesis by default so voice playback works without an AI account.
- Exposes two configurable voice slots labelled **Female voice** and **Male voice**.
- Lets the learner select the actual installed voice for each slot; the plugin does not claim to infer gender reliably.
- Supports rate and pitch controls.
- Stops current speech before starting another passage.
- Provides a future-compatible boundary for optional OpenAI speech generation.

### 4.5 Learning cards

- Vocabulary cards and term cards share one Markdown schema.
- Each card includes type, title/term, status, source path, creation time, selected quote, reading context, and optional tutor explanation.
- Vocabulary cards additionally include contextual meaning, IPA/pronunciation guidance, collocations, and examples when present in the tutor explanation.
- Cards use collision-safe filenames and never overwrite an existing note without confirmation.
- A card can be opened immediately after creation.

### 4.6 Saved explanations

- A response can be saved as an independent Markdown note in a configured folder.
- The note contains the source quote, source backlink, scope, question, response, and creation timestamp.
- A response can also be appended to the source note under a generated callout.

### 4.7 Vault retrieval

- Searches Markdown notes locally using title, path, and content terms.
- Excludes configured folders and the plugin's generated folders when requested.
- Returns bounded excerpts and source paths.
- Does not upload the entire vault for one question.
- Semantic embeddings are outside the first release.

## 5. Non-functional requirements

- TypeScript source with strict type checking.
- No client-side telemetry, advertising, code obfuscation, or self-update mechanism.
- Network use is limited to user-triggered AI requests and is documented in the README.
- Desktop and mobile compatibility are design targets; Node-only APIs are not used in core flows.
- All global DOM events and views are registered through the Obsidian plugin lifecycle.
- Keyboard focus states, reduced motion, light/dark themes, and touch targets are supported.
- Generated notes remain human-readable without the plugin.
- Unit tests cover card serialization, prompt construction, context extraction, and retrieval ranking.

## 6. Visual direction

The interface resembles a focused technical reading desk rather than a generic messenger.

- **Paper**: `var(--background-primary)`
- **Ink**: `var(--text-normal)`
- **Cobalt**: `#3568d4` for AI and source links
- **Verdant**: `#2f8f68` for vocabulary learning
- **Amber**: `#c88a22` for passages worth revisiting
- **Rose**: `#bd536c` for ambiguity and critical review

Typography inherits Obsidian's interface and text fonts. IPA, model identifiers, and source paths use the configured monospace font. The signature element is a narrow context rail matching the selected reading-mark color and visually connecting the source quote, tutor explanation, and save/card actions.

```text
┌──────────────────────────────┐
│ AI tutor        note · scope │
├─ blue context rail ──────────┤
│ “selected source text…”      │
│                              │
│ Explanation rendered here    │
│ with sources and follow-up   │
│                              │
│ [Save note] [Term card]      │
├──────────────────────────────┤
│ Ask about this context…      │
└──────────────────────────────┘
```

## 7. Acceptance criteria for the first market candidate

- A learner can select text, highlight or underline it, and open an AI explanation in the right sidebar.
- A learner can continue at least one follow-up turn with the preceding explanation included.
- A tutor response can be saved as a new Markdown note and as either learning-card type.
- An English selection can be spoken with either configured voice slot.
- A source note or local vault search can be used as AI context.
- API keys are absent from plugin data, logs, generated notes, and release artifacts.
- `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` pass.
- The release contains `main.js`, `manifest.json`, and `styles.css` with matching semantic versions.
- A clean test vault can install the release assets and load the plugin without console errors.
- README discloses network use, provider billing, storage, privacy, and platform support.

## 8. Initial exclusions

- PDF-native annotation and PDF file modification.
- Cloud sync, shared classrooms, and multi-user comments.
- Automatic background AI processing.
- Provider-hosted vector stores or automatic whole-vault uploads.
- Automatic gender classification of installed voices.
- Automatic publication without the repository owner's GitHub and Obsidian authorization.

## 9. Distribution

1. Develop and test locally using the official Obsidian plugin structure.
2. Publish a BRAT-compatible beta release for a clean-vault smoke test.
3. Publish a semantic GitHub release containing the required assets.
4. Submit the repository through the Obsidian Community directory.
5. Resolve automated review findings and publish incremented releases until the listing passes.

