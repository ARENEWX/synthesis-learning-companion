# Synthesis Learning Companion

This context defines the language for an Obsidian reading companion that turns selected source text into durable explanations and reusable learning cards.

## Reading

**Source note**:
The Markdown note currently being read and used as the origin of a selection.
_Avoid_: Article, document, file

**Selection**:
The exact text intentionally marked by the learner in a source note.
_Avoid_: Highlight, quote, snippet

**Reading context**:
The selection together with its containing paragraph, source note, and source location.
_Avoid_: Prompt context, surrounding text

**Reading mark**:
A visible highlight or underline applied to a selection.
_Avoid_: Annotation, highlight

## Learning

**Tutor explanation**:
An AI response grounded in a reading context and the preceding tutor conversation.
_Avoid_: Answer, completion, comment

**Learning card**:
A durable Markdown note created from a selection, its reading context, and an optional tutor explanation.
_Avoid_: Flashcard, note card

**Vocabulary card**:
A learning card for an English word or phrase, including its contextual meaning and pronunciation information.
_Avoid_: Word card, vocab

**Term card**:
A learning card for a technical or domain-specific term found in a source note.
_Avoid_: Concept card, glossary entry

**Saved explanation**:
A standalone Markdown note containing a tutor explanation and a backlink to its source note.
_Avoid_: Export, AI note

**Mastery status**:
The learner's declared relationship to a learning card: learning, mastered, or ignored.
_Avoid_: Progress, card state

## Voice

**Reading voice**:
One of the learner-configured English system voices used to speak a selection, paragraph, or source note.
_Avoid_: TTS model, narrator

**Voice slot**:
A learner-named voice choice exposed as the male or female reading action without asserting a voice's gender automatically.
_Avoid_: Gender detection, voice gender

