import type { Level } from "./levels";

type PromptVars = {
  level: Level;
  userTweet: string;
};

export function buildGamePrompt({ level, userTweet }: PromptVars) {
  const countries = level.level_response.slice(0, 3); // ensure <= 3
  // Explain sentiment mapping + GDP bounds to the model to avoid extremes unless warranted.
  return `
You are a geopolitical simulation engine. Given a global situation and a tweet from the United States, you will produce ONLY a single compact JSON object with:
- "responses": a map from country to dramatized reaction (one short paragraph per country).
- "gdp_impact": the net change to U.S. GDP as { direction, amount_trillion }.

Rules:
1) Countries MUST be exactly: ${countries.join(", ")}.
2) Responses must be extreme, dramatic, and gamey (e.g., sweeping sanctions, boycotts, military drills, emergency summits, mega-investments), but stay within plausible geopolitical tone.
3) Determine each country's stance (negative / neutral / positive) based on the text of the user's tweet and the situation.
4) Compute U.S. GDP impact ONLY from the aggregate of those stances.
   - Range: -5 to +1 (trillion USD).
   - Use extremes only when reactions clearly justify them (e.g., coordinated sanctions, embargo -> near -5; historic market opening or alliance -> up to +1).
   - Mixed signals → mild changes (e.g., -1.5 to +0.5).
   - Mostly neutral → ~ -0.5 to +0.25.
5) Output JSON ONLY (no code fences, no commentary around it).

Current Situation: ${level.level_prompt}

User's Tweet (from the U.S.): "${userTweet}"

Return ONLY:
{
  "responses": {
    "${countries[0]}": "…",
    "${countries[1] ?? countries[0]}": "…",
    "${countries[2] ?? countries[0]}": "…"
  },
  "gdp_impact": {
    "direction": "increase" | "decrease",
    "amount_trillion": number
  }
}
  `.trim();
}
