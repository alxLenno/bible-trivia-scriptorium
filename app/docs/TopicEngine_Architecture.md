# Architecture Deep-Dive: Modular Topic Engine

This document outlines the design philosophy and technical structure of the **Modular Topic Engine**, specifically focusing on isolation for debugging and universal language support.

## 1. Modular Isolation
The engine moves away from a single "Topics" list. Instead, every topic is treated as a self-contained module.

### Structure: `src/data/topics/[topic_id].js`
Each module contains:
- **Localizations**: A map of names across all supported languages.
- **Prompt Logic**: Custom strings that steer the AI's "persona" for that topic.
- **Fallbacks**: A pre-verified question bank used for offline play or AI failures.

**Benefit**: You can optimize the "Faith" topic's AI instructions without risk of changing how "Love" or "History" generates questions.

## 2. The Smart Prompting Engine
The engine acts as a middleware between the UI and the AI Service.

### The Decision Matrix
When a user selects a topic and clicks "Begin Trial," the engine runs this logic:

| Input | Logic | AI Steering |
| :--- | :--- | :--- |
| **No References** | Broad Discovery | "Explore [Topic] using the entire Bible as your source." |
| **With References** | Contextual Anchor | "Focus EXCLUSIVELY on [Refs]. Use broad knowledge only to explain context." |

## 3. Universal Language Discovery
The system is designed to "learn" new languages without developer intervention.

### The "Handshake" Workflow
1.  **Selection**: User selects a new Bible version (e.g., `Luo2020.xml`).
2.  **Detection**:
    - The engine fetches **Genesis 1:1**, **Psalm 23:1**, and **John 3:16**.
    - It sends these to the AI with the prompt: *"Identify the language of these verses. Respond with the ISO code and the English name."*
3.  **UI Localization**:
    - Once identified as "Luo," the engine scans all loaded topic files.
    - If a topic lacks a "Luo" name, it uses the AI to generate one on the fly (e.g., "Love" -> "Hera").
4.  **Trivia Generation**: All subsequent prompts include the instruction: *"GENERATE IN LUO."*

## 4. Debugging & Maintenance
Each engine component is isolated:
- **`TopicEngine.js`**: Logic for combining static and custom topics.
- **`LanguageDiscovery.js`**: Logic for identifying XML languages.
- **`PromptProcessor.js`**: Logic for building the final LLM string.

This isolation ensures that a bug in "Language Detection" cannot crash the "Topic Rendering" system.
