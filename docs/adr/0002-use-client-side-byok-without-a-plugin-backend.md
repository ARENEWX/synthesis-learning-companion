# Use client-side BYOK without a plugin backend

AI requests go directly from Obsidian to the learner-configured OpenAI or compatible endpoint, with keys held in Obsidian secret storage and provider-side response storage disabled where supported. This avoids operating a sensitive relay service and keeps billing ownership clear, at the cost of limiting the first release to endpoints that work from Obsidian's request layer and requiring explicit network-use disclosure.

