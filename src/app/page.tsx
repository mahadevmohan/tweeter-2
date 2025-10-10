"use client";

import { useState, useEffect, useRef } from "react";
import Script from "next/script";

export default function Home() {
  const [situation, setSituation] = useState("Global economic summit in crisis");
  const [tweet, setTweet] = useState("");
  const [responses, setResponses] = useState<any>(null);
  const [gdp, setGdp] = useState(100); // start GDP at 100 (trillion, index)
  const [loading, setLoading] = useState(false);
  const [tweetPosted, setTweetPosted] = useState(false);
  const [displayGdp, setDisplayGdp] = useState(100);
  const [gdpAnimating, setGdpAnimating] = useState(false);
  // Removed Puter SDK dependencies - using fallback mode only
  const pointsSoundRef = useRef<HTMLAudioElement>(null);
  const bgMusicRef = useRef<HTMLAudioElement>(null);

  // Animate GDP changes
  useEffect(() => {
    const animateGdp = () => {
      const diff = gdp - displayGdp;
      if (Math.abs(diff) > 0.1) {
        setDisplayGdp(prev => prev + diff * 0.1);
      } else {
        setDisplayGdp(gdp);
      }
    };
    
    const interval = setInterval(animateGdp, 50);
    return () => clearInterval(interval);
  }, [gdp, displayGdp]);

  // Play sound and animate when GDP changes
  useEffect(() => {
    if (pointsSoundRef.current && gdp !== 100) {
      setGdpAnimating(true);
      pointsSoundRef.current.currentTime = 0;
      pointsSoundRef.current.play().catch(console.log);
      setTimeout(() => setGdpAnimating(false), 500);
      
      // Stop the sound after it plays
      setTimeout(() => {
        if (pointsSoundRef.current) {
          pointsSoundRef.current.pause();
          pointsSoundRef.current.currentTime = 0;
        }
      }, 1000);
    }
  }, [gdp]);

  // Groq AI integration using your existing API
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    setLoading(true);
    setResponses(null);

    const prompt = `Situation: ${situation}
User's Tweet: "${tweet}"

You are a geopolitical AI analyzing how world leaders would respond to this tweet and its economic impact. Return ONLY a valid JSON object with this exact structure:

{
  "responses": {
    "President Xi": "Response from Chinese President",
    "Prime Minister Modi": "Response from Indian Prime Minister", 
    "Chancellor Merkel": "Response from German Chancellor"
  },
  "gdp_impact": {
    "direction": "increase" or "decrease",
    "amount_trillion": number between 0.5 and 5.0
  }
}

Make the responses realistic, diplomatic, and varied. Consider the tweet's content when determining GDP impact.`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          fullResponse += chunk;
        }
      }

      // Parse the JSON response
      const parsed = JSON.parse(fullResponse);
      setResponses(parsed);

      // animate GDP change
      const amt = parsed.gdp_impact?.amount_trillion ?? 0;
      const dir = parsed.gdp_impact?.direction === "decrease" ? -1 : 1;
      setGdp((prev) => prev + dir * amt);
      setTweetPosted(true);
    } catch (err) {
      console.error("AI error", err);
      alert("AI processing failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* No external dependencies */}

      <div className="arcade-border">
        <div className="arcade-container">
          {/* Game Title */}
          <h1 className="text-center text-2xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
            tweeter
          </h1>

          {/* Current Scenario */}
          <div className="mb-6 p-3" style={{ background: 'var(--border-blue)', border: '2px solid var(--foreground)' }}>
            <h2 className="text-sm font-bold mb-2">Current Situation:</h2>
            <p className="text-xs leading-relaxed">{situation}</p>
          </div>

          {/* Tweet Input */}
          {!tweetPosted && (
            <div className="mb-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                  className="arcade-input"
                  placeholder="What's happening?"
                  value={tweet}
                  onChange={(e) => setTweet(e.target.value)}
                  required
                  rows={3}
                  maxLength={280}
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: 'var(--foreground)' }}>{tweet.length}/280</span>
                  <button
                    type="submit"
                    className="arcade-button"
                    disabled={loading}
                  >
                    {loading ? "thinking..." : "twit"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Posted Tweet Display */}
          {tweetPosted && (
            <div className="mb-6">
              <div className="tweet-box">
                <div className="flex items-start mb-3">
                  <div className="avatar mr-3">P</div>
                  <div className="flex-1">
                    <div className="font-bold text-sm">President</div>
                    <div className="text-xs opacity-70">@USPresident</div>
                  </div>
                </div>
                <p className="text-sm mb-3">{tweet}</p>
                <div className="flex space-x-4 text-xs">
                  <span>Likes: {Math.floor(Math.random() * 50) + 10}</span>
                  <span>Comments: {Math.floor(Math.random() * 20) + 5}</span>
                  <span>Retweets: {Math.floor(Math.random() * 100) + 25}</span>
                </div>
              </div>
              
              {/* DONE Button */}
              <div className="text-center mt-4">
                <button 
                  className="arcade-button"
                  onClick={() => {
                    setTweetPosted(false);
                    setTweet("");
                    setResponses(null);
                  }}
                >
                  done
                </button>
              </div>
            </div>
          )}

          {/* Country Responses */}
          {responses && (
            <div className="mb-6">
              <h2 className="text-sm font-bold mb-3">World Leaders Respond:</h2>
              <div className="space-y-3">
                {Object.entries(responses.responses || {}).map(([leader, msg], index) => (
                  <div key={leader} className="tweet-box">
                    <div className="flex items-start mb-2">
                      <div className="avatar mr-3" style={{ background: ['#ff6b6b', '#4ecdc4', '#45b7d1'][index] }}>
                        {leader.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm">{leader}</div>
                        <div className="text-xs opacity-70">Country Leader</div>
                      </div>
                    </div>
                    <p className="text-sm">{String(msg)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GDP Counter */}
          <div className={`gdp-display ${gdpAnimating ? 'gdp-animated' : ''}`}>
            ${displayGdp.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          </div>
        </div>
      </div>

      {/* Audio Elements */}
      <audio ref={bgMusicRef} src="/music/bgmusic.wav" loop />
      <audio ref={pointsSoundRef} src="/music/points.mp3" />
    </main>
  );
}