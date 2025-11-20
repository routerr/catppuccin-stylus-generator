import { z } from "zod";

export const UrlSchema = z
  .string()
  .url({ message: "Please enter a valid URL (e.g., https://example.com)" });

export const ApiKeySchema = z
  .string()
  .min(1, { message: "API Key is required" });

export const AIProviderSchema = z.enum(["openrouter", "chutes", "ollama"]);

export const FlavorSchema = z.enum(["latte", "frappe", "macchiato", "mocha"]);

export const AccentSchema = z.enum([
  "rosewater",
  "flamingo",
  "pink",
  "mauve",
  "red",
  "maroon",
  "peach",
  "yellow",
  "green",
  "teal",
  "sky",
  "sapphire",
  "blue",
  "lavender",
  "text",
]);
