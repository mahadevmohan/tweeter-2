import { Groq } from "groq-sdk";

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

// convenience types
export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

// Helper function to check API key at runtime
export function validateApiKey() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing. Add it to .env.local and Vercel env.");
  }
}