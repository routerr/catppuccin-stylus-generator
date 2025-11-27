# Overview

This project is a web app created using React 19 and vite 6, for a user to generate thier own beautiful, harmony, cozy Catppuccin (reference to https://catppuccin.com/ for more information) website customize themes, which can be applied using extension like Stylus, with specific format of less codes, by our web app.

# Features

The generated web theme should have four Catppuccin flavors, and all the Catppuccin accents, as options, to dynamically specify the coloring of the theme.
A concept of bi-accent is introduced to the generated theme: A bi-accent is the nearest Catppuccin color in the flavor set in 72 degree from a main-accent on the color wheel. Each accent would have two bi-accents, while each bi-accent should have its own another two bi-accents. The elements like links, buttons or any class chosen by the AI, are colored randomly (or determine at generating time by the AI) in one of the colors: main-accent selected by the user, or the two bi-accents derived from the main-accent, while the main-accent cover 60% of the customized colors, and the other two accents share the 40%.
Further, when an element is to show gradient effect, the color set should be in the two colors: The customized color (main-accent) of the element, and one of the bi-accent of the main-accent of the element. The gradient coloring should be used gracefully.

# Generate Process

The generate process should involve web crawlers to get CSS styles and web vision from URLs, then a LLM AI from online or local provider, would analyze the fetched data, coloring the CSS classes and webpage elements with Catppuccin and accent phylosophy, generate the four flavor themes with corresponding accents, create LESS codes with stylus specified format, then let the user easily to download or copy to clipboard for later applying.
All everything should happen at the client side in the browser. Let the user provide their own online crawler API keys (if usable) or crawler server host, and provide API keys for AI providers, at least including OpenRouter, Chutes, Ollama. The tokens should be able to be saved locally and savely in the browser side.

# Building Proces

All the implementation of this app is by AI, while reviewed and monitered by human. The AI should be able to generate the code by itself, and the human should be able to review the code and monitor the AI's behavior. When an AI is to work on the project, it should always first review, update, or create a progress-plan.md, with detailed step by step plan of the AI's work, structured by phases, then let the human review the plan, and update the plan if necessary, by asking the human questions with options, and let the AI update the plan based on the human's answer. When a progress-plan.md is updated, the AI should always complete the plan, step by step, and record the progress in the progress-log.md, for its later or another session's fast catch up. Note that the plan is always fexible and could be changed anytime by discussions with the human.
