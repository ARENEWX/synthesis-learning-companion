import type { EditorPosition } from "obsidian";

export const TUTOR_VIEW_TYPE = "synthesis-learning-tutor";
export const API_KEY_SECRET_ID = "synthesis-learning-api-key";

export type TutorMode = "explain" | "english";
export type ContextScope = "selection" | "note" | "vault";
export type CardType = "vocabulary" | "term";
export type MasteryStatus = "learning" | "mastered" | "ignored";
export type MarkColor = "amber" | "blue" | "green" | "rose";
export type MarkStyle = "highlight" | "underline";
export type VoiceSlot = "female" | "male";
export type ProviderProtocol = "responses" | "chat-completions";

export interface SelectionContext {
  selection: string;
  paragraph: string;
  sentence: string;
  fullNote: string;
  noteTitle: string;
  notePath: string;
  sourceLine: number;
  from: EditorPosition;
  to: EditorPosition;
  markColor?: MarkColor;
}

export interface TutorTurn {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface RetrievalSource {
  path: string;
  title: string;
  excerpt: string;
  score: number;
}

export interface LearningCardInput {
  type: CardType;
  term: string;
  status: MasteryStatus;
  context: SelectionContext;
  explanation?: string;
  question?: string;
  createdAt: string;
}

export interface SavedExplanationInput {
  context: SelectionContext;
  scope: ContextScope;
  question: string;
  explanation: string;
  createdAt: string;
  sources: RetrievalSource[];
}

export interface SynthesisSettings {
  apiBaseUrl: string;
  model: string;
  protocol: ProviderProtocol;
  maxContextCharacters: number;
  maxOutputTokens: number;
  vaultResultLimit: number;
  explanationFolder: string;
  cardFolder: string;
  excludedFolders: string;
  femaleVoiceUri: string;
  maleVoiceUri: string;
  speechRate: number;
  speechPitch: number;
  autoOpenCreatedNote: boolean;
}

export const DEFAULT_SETTINGS: SynthesisSettings = {
  apiBaseUrl: "https://api.openai.com/v1",
  model: "gpt-4o-mini",
  protocol: "responses",
  maxContextCharacters: 24_000,
  maxOutputTokens: 1_800,
  vaultResultLimit: 5,
  explanationFolder: "Synthesis/Explanations",
  cardFolder: "Synthesis/Learning Cards",
  excludedFolders: ".trash, Templates",
  femaleVoiceUri: "",
  maleVoiceUri: "",
  speechRate: 0.95,
  speechPitch: 1,
  autoOpenCreatedNote: true
};
