import type { SynthesisSettings, VoiceSlot } from "./types";

const FEMALE_HINTS = ["jenny", "aria", "samantha", "victoria", "zira", "susan", "female"];
const MALE_HINTS = ["guy", "ryan", "david", "mark", "alex", "daniel", "male"];

export function availableEnglishVoices(): SpeechSynthesisVoice[] {
  if (!("speechSynthesis" in window)) return [];
  return window.speechSynthesis
    .getVoices()
    .filter((voice) => voice.lang.toLocaleLowerCase().startsWith("en"))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function suggestedVoiceUri(slot: VoiceSlot, voices: SpeechSynthesisVoice[]): string {
  const hints = slot === "female" ? FEMALE_HINTS : MALE_HINTS;
  const matching = voices.find((voice) => {
    const name = voice.name.toLocaleLowerCase();
    return hints.some((hint) => name.includes(hint));
  });
  return matching?.voiceURI ?? voices[slot === "female" ? 0 : Math.min(1, voices.length - 1)]?.voiceURI ?? "";
}

export function cleanTextForSpeech(text: string): string {
  return text
    .replace(/^---[\s\S]*?---\s*/u, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, target: string, alias?: string) => alias ?? target)
    .replace(/<[^>]+>/g, "")
    .replace(/[*_~=#>`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function splitSpeechText(text: string, maximum = 220): string[] {
  const sentences = text.match(/[^.!?。！？]+[.!?。！？]?/gu) ?? [text];
  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences.map((item) => item.trim()).filter(Boolean)) {
    if (sentence.length > maximum) {
      if (current) chunks.push(current);
      for (let index = 0; index < sentence.length; index += maximum) {
        chunks.push(sentence.slice(index, index + maximum));
      }
      current = "";
      continue;
    }
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length > maximum) {
      chunks.push(current);
      current = sentence;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export function speakText(text: string, slot: VoiceSlot, settings: SynthesisSettings): void {
  if (!("speechSynthesis" in window)) throw new Error("Speech synthesis is unavailable on this device.");
  const cleaned = cleanTextForSpeech(text);
  if (!cleaned) throw new Error("There is no readable text in this selection.");
  const voices = availableEnglishVoices();
  const configured = slot === "female" ? settings.femaleVoiceUri : settings.maleVoiceUri;
  const voiceUri = configured || suggestedVoiceUri(slot, voices);
  const voice = voices.find((candidate) => candidate.voiceURI === voiceUri);
  const utterance = new SpeechSynthesisUtterance(cleaned);
  window.speechSynthesis.cancel();
  const chunks = splitSpeechText(cleaned);
  let index = 0;
  const speakNext = (): void => {
    const chunk = chunks[index];
    if (!chunk) {
      return;
    }
    const next = index === 0 ? utterance : new SpeechSynthesisUtterance(chunk);
    next.text = chunk;
    next.lang = voice?.lang ?? "en-US";
    next.voice = voice ?? null;
    next.rate = settings.speechRate;
    next.pitch = settings.speechPitch;
    next.onend = () => {
      index += 1;
      speakNext();
    };
    window.speechSynthesis.speak(next);
  };
  speakNext();
}

export function stopSpeaking(): void {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}
