function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomEngagement() {
  const likes = randInt(150_000, 5_000_000);
  // keep plausible relationships
  const retweets = Math.max(20_000, Math.floor(likes * (0.08 + Math.random() * 0.1))); // 8–18%
  const comments = Math.max(8_000, Math.floor(likes * (0.02 + Math.random() * 0.06))); // 2–8%
  return { likes, retweets, comments };
}
