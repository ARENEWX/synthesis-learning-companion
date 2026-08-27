import { PluginSettingTab, Setting, type App } from "obsidian";
import type SynthesisLearningPlugin from "./main";
import { availableEnglishVoices } from "./voice";

export class SynthesisSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: SynthesisLearningPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    new Setting(containerEl)
      .setName("AI tutor connection")
      .setHeading();
    containerEl.createEl("p", {
      cls: "setting-item-description",
      text: "The plugin sends only user-triggered requests and selected context to the provider configured below. Marks, voices, and manual cards work without an API key."
    });

    new Setting(containerEl)
      .setName("API key")
      .setDesc("Stored in this device's Obsidian secret storage. It is not written to the vault or plugin data.")
      .addText((text) => {
        text.inputEl.type = "password";
        text.setPlaceholder("sk-…")
          .setValue(this.plugin.getApiKey())
          .onChange((value) => this.plugin.setApiKey(value.trim()));
      });

    new Setting(containerEl)
      .setName("API protocol")
      .setDesc("Use Responses for OpenAI. Choose Chat Completions for compatible providers that do not expose /responses.")
      .addDropdown((dropdown) => dropdown
        .addOption("responses", "OpenAI Responses API")
        .addOption("chat-completions", "Chat Completions compatible")
        .setValue(this.plugin.settings.protocol)
        .onChange(async (value) => {
          this.plugin.settings.protocol = value === "chat-completions" ? "chat-completions" : "responses";
          await this.plugin.saveSettings();
        }));

    this.addTextSetting("API base URL", "Example: https://api.openai.com/v1", "apiBaseUrl");
    this.addTextSetting("Model", "Provider model ID", "model");

    new Setting(containerEl)
      .setName("Maximum context characters")
      .setDesc("Long notes are truncated before they leave the device.")
      .addText((text) => text
        .setValue(String(this.plugin.settings.maxContextCharacters))
        .onChange(async (value) => {
          const parsed = Number.parseInt(value, 10);
          if (Number.isFinite(parsed) && parsed >= 2_000) {
            this.plugin.settings.maxContextCharacters = parsed;
            await this.plugin.saveSettings();
          }
        }));

    new Setting(containerEl)
      .setName("Vault search results")
      .setDesc("Maximum local excerpts added to a vault-scoped question.")
      .addSlider((slider) => slider
        .setLimits(1, 10, 1)
        .setValue(this.plugin.settings.vaultResultLimit)
        .onChange(async (value) => {
          this.plugin.settings.vaultResultLimit = value;
          await this.plugin.saveSettings();
        }));

    this.addTextSetting("Saved explanations folder", "Folder for one-click tutor notes.", "explanationFolder");
    this.addTextSetting("Learning cards folder", "Shared folder for vocabulary and terminology cards.", "cardFolder");
    this.addTextSetting("Excluded vault folders", "Comma-separated folders skipped by vault retrieval.", "excludedFolders");

    new Setting(containerEl)
      .setName("English reading voices")
      .setHeading();
    containerEl.createEl("p", {
      cls: "setting-item-description",
      text: "Male and female are user-defined voice slots. The plugin does not infer a person's gender from a voice name."
    });
    const voices = availableEnglishVoices();
    this.addVoiceSetting("Female voice", "femaleVoiceUri", voices);
    this.addVoiceSetting("Male voice", "maleVoiceUri", voices);

    new Setting(containerEl)
      .setName("Reading speed")
      .setDesc("1.0 is the system voice's normal speed.")
      .addSlider((slider) => slider
        .setLimits(0.5, 1.5, 0.05)
        .setValue(this.plugin.settings.speechRate)
        .onChange(async (value) => {
          this.plugin.settings.speechRate = value;
          await this.plugin.saveSettings();
        }));
  }

  private addTextSetting(
    name: string,
    description: string,
    key: "apiBaseUrl" | "model" | "explanationFolder" | "cardFolder" | "excludedFolders"
  ): void {
    new Setting(this.containerEl)
      .setName(name)
      .setDesc(description)
      .addText((text) => text
        .setValue(this.plugin.settings[key])
        .onChange(async (value) => {
          this.plugin.settings[key] = value.trim();
          await this.plugin.saveSettings();
        }));
  }

  private addVoiceSetting(
    name: string,
    key: "femaleVoiceUri" | "maleVoiceUri",
    voices: SpeechSynthesisVoice[]
  ): void {
    new Setting(this.containerEl)
      .setName(name)
      .setDesc(voices.length > 0 ? "Choose an English voice installed on this device." : "No English system voices are currently available.")
      .addDropdown((dropdown) => {
        dropdown.addOption("", "Automatic");
        for (const voice of voices) dropdown.addOption(voice.voiceURI, `${voice.name} · ${voice.lang}`);
        dropdown
          .setValue(this.plugin.settings[key])
          .onChange(async (value) => {
            this.plugin.settings[key] = value;
            await this.plugin.saveSettings();
          });
      });
  }
}
