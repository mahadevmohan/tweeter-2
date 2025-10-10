import { Groq } from "groq-sdk";

if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY is missing. Add it to .env.local and Vercel env.");
}

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// convenience types
export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };