"use client";

import { useState, useEffect, useRef } from "react";
import { pickRandomUnplayed, markPlayed, type Level } from "../../lib/levels";
import { buildGamePrompt } from "../../lib/prompt";
import { randomEngagement } from "../../lib/engagement";
import CountryAvatar from "../../components/CountryAvatar";

// GDP start value
const STARTING_GDP = 29_018_000_000_000;

export default function Home() {
  const [level, setLevel] = useState<Level | null>(null);
  const [tweet, setTweet] = useState("");
  const [responses, setResponses] = useState<{
    responses: Record<string, string>;
    gdp_impact: { direction: string; amount_trillion: number };
  } | null>(null);
  const [engagement, setEngagement] = useState({ likes: 0, retweets: 0, comments: 0 });
  const [displayEngagement, setDisplayEngagement] = useState({ likes: 0, retweets: 0, comments: 0 });
  const [visibleResponses, setVisibleResponses] = useState<Array<{ country: string; message: unknown }>>([]);
  const [allResponsesLoaded, setAllResponsesLoaded] = useState(false);
  const [gdp, setGdp] = useState(STARTING_GDP);
  const [loading, setLoading] = useState(false);
  const [tweetPosted, setTweetPosted] = useState(false);
  const [displayGdp, setDisplayGdp] = useState(STARTING_GDP);
  const [gdpAnimating, setGdpAnimating] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showRules, setShowRules] = useState(false);
  // Removed Puter SDK dependencies - using fallback mode only
  const pointsSoundRef = useRef<HTMLAudioElement>(null);
  const bgMusicRef = useRef<HTMLAudioElement>(null);

  // Animate GDP changes with exponential slowdown (completes in ~3.5 seconds)
  useEffect(() => {
    if (Math.abs(gdp - displayGdp) < 0.1) {
      // Already at target
      setGdpAnimating(false);
      return;
    }

    setGdpAnimating(true);
    
    const animateGdp = () => {
      const diff = gdp - displayGdp;
      const absDiff = Math.abs(diff);
      
      if (absDiff > 0.1) {
        const totalChange = Math.abs(gdp - STARTING_GDP) || 1;
        const remainingRatio = absDiff / totalChange;
        
        // Exponential slowdown for GDP animation - faster overall to finish in ~3.5s
        let speed;
        if (remainingRatio > 0.5) {
          speed = 0.35; // Fast at start
        } else if (remainingRatio > 0.1) {
          speed = 0.28; // Medium speed
        } else if (remainingRatio > 0.01) {
          speed = 0.20; // Slow
        } else {
          speed = 0.15; // Very slow at the end
        }
        
        setDisplayGdp(prev => prev + diff * speed);
      } else {
        setDisplayGdp(gdp);
        setGdpAnimating(false);
      }
    };
    
    const timer = setInterval(animateGdp, 50);
    return () => clearInterval(timer);
  }, [gdp, displayGdp]);

  // Play point sounds at dynamic intervals (slows down as approaching target)
  useEffect(() => {
    if (!gdpAnimating || isMuted) {
      // Stop any playing sound when animation stops
      if (pointsSoundRef.current) {
        pointsSoundRef.current.pause();
        pointsSoundRef.current.currentTime = 0;
      }
      return;
    }

    let soundTimer: NodeJS.Timeout;
    let isPlaying = false;
    
    const scheduleNextSound = () => {
      const diff = Math.abs(gdp - displayGdp);
      
      // Stop if we're very close to target
      if (diff < 0.5) {
        if (pointsSoundRef.current) {
          pointsSoundRef.current.pause();
          pointsSoundRef.current.currentTime = 0;
        }
        return;
      }
      
      const totalChange = Math.abs(gdp - STARTING_GDP) || 1;
      const remainingRatio = diff / totalChange;
      
      // Exponential slowdown: fast at start, very slow at end
      // When 100% remaining: ~60ms
      // When 50% remaining: ~120ms
      // When 10% remaining: ~600ms
      // When 1% remaining: ~6000ms (6 seconds)
      let soundInterval;
      if (remainingRatio > 0.5) {
        soundInterval = 60 + Math.floor((1 - remainingRatio) * 120);
      } else if (remainingRatio > 0.1) {
        soundInterval = 180 + Math.floor((0.5 - remainingRatio) * 1050);
      } else {
        // Final stretch: exponential slowdown
        soundInterval = Math.floor(600 / remainingRatio);
      }
      
      // Play sound only if not already playing
      if (pointsSoundRef.current && gdpAnimating && !isMuted && !isPlaying) {
        isPlaying = true;
        const sound = pointsSoundRef.current;
        
        // Reset and play
        sound.currentTime = 0;
        sound.volume = 0.24;
        
        const playPromise = sound.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Sound started playing successfully
            })
            .catch((error) => {
              console.log("Sound play error:", error);
              isPlaying = false;
            });
        }
        
        // Mark as not playing after a short duration
        setTimeout(() => {
          isPlaying = false;
        }, 100);
      }
      
      // Schedule next sound with updated interval
      soundTimer = setTimeout(scheduleNextSound, soundInterval);
    };
    
    scheduleNextSound(); // Start the chain
    
    return () => {
      clearTimeout(soundTimer);
      isPlaying = false;
      const currentSound = pointsSoundRef.current;
      if (currentSound) {
        currentSound.pause();
        currentSound.currentTime = 0;
      }
    };
  }, [gdpAnimating, gdp, displayGdp, isMuted]);

  // Animate engagement numbers
  useEffect(() => {
    const animateEngagement = () => {
      setDisplayEngagement(prev => ({
        likes: Math.max(0, prev.likes + Math.floor((engagement.likes - prev.likes) * 0.1)),
        retweets: Math.max(0, prev.retweets + Math.floor((engagement.retweets - prev.retweets) * 0.1)),
        comments: Math.max(0, prev.comments + Math.floor((engagement.comments - prev.comments) * 0.1))
      }));
    };
    
    const interval = setInterval(animateEngagement, 100);
    return () => clearInterval(interval);
  }, [engagement]);

  // Simulate real-time engagement changes (only until all responses are loaded)
  useEffect(() => {
    if (!tweetPosted || allResponsesLoaded) return;

    const realTimeInterval = setInterval(() => {
      setEngagement(prev => ({
        likes: Math.max(0, prev.likes + Math.floor((Math.random() - 0.5) * 100)),
        retweets: Math.max(0, prev.retweets + Math.floor((Math.random() - 0.5) * 20)),
        comments: Math.max(0, prev.comments + Math.floor((Math.random() - 0.5) * 30))
      }));
    }, 1500); // Update every 1.5 seconds

    return () => clearInterval(realTimeInterval);
  }, [tweetPosted, allResponsesLoaded]);

  // Stagger country responses (newest on top)
  useEffect(() => {
    if (!responses || !responses.responses) return;

    const responseEntries = Object.entries(responses.responses);
    setVisibleResponses([]);
    setAllResponsesLoaded(false);

    responseEntries.forEach(([country, message], index) => {
      setTimeout(() => {
        setVisibleResponses(prev => [{ country, message }, ...prev]); // Add to beginning of array

        // Mark as fully loaded after the last response
        if (index === responseEntries.length - 1) {
          setTimeout(() => setAllResponsesLoaded(true), 500);
        }
      }, (index + 1) * 2500); // 2.5 second intervals
    });
  }, [responses]);

  // Initialize level on first mount
  useEffect(() => {
    if (!level) {
      const picked = pickRandomUnplayed();
      setLevel(picked);
    }
  }, [level]);

  // Handle mute/unmute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (bgMusicRef.current) {
      if (!isMuted) {
        bgMusicRef.current.pause();
      } else {
        bgMusicRef.current.play().catch(console.log);
      }
    }
  };

  // Start background music on first user interaction
  const startBackgroundMusic = () => {
    if (bgMusicRef.current && !isMuted) {
      bgMusicRef.current.play().catch(console.log);
    }
  };

  // JSON extraction helper
  function extractJsonSafe(s: string) {
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    if (start === -1 || end === -1 || end < start) throw new Error("No JSON object found");
    return JSON.parse(s.slice(start, end + 1));
  }

  // Format engagement numbers with K/M suffixes
  function formatEngagement(num: number): string {
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1) + 'M';
    } else if (num >= 1_000) {
      return (num / 1_000).toFixed(1) + 'K';
    } else {
      return num.toString();
    }
  }


  // Groq AI integration using your existing API
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!tweet.trim() || !level) return;
    
    // Start background music on first interaction
    startBackgroundMusic();
    
    setLoading(true);
    setResponses(null);
    setEngagement(randomEngagement());

    const prompt = buildGamePrompt({ level, userTweet: tweet });

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "Return ONLY a valid, compact JSON object. No code fences." },
            { role: "user", content: prompt }
          ],
          temperature: 0.8
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
      const parsed = extractJsonSafe(fullResponse);
      setResponses(parsed);

      // animate GDP change
      const dir = parsed?.gdp_impact?.direction === "decrease" ? -1 : 1;
      const amt = Number(parsed?.gdp_impact?.amount_trillion || 0);
      if (Number.isFinite(amt)) {
        setGdp(prev => prev + dir * amt * 1_000_000_000_000);
      }
      setTweetPosted(true);
    } catch (err) {
      console.error("AI error", err);
      alert("AI processing failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function onNextSituation() {
    if (!level) return;
    // mark current as played, pick another
    markPlayed(level.level_id);
    const next = pickRandomUnplayed();
    setLevel(next);
    // reset UI but KEEP GDP as running total
    setTweet("");
    setResponses(null);
    setEngagement({ likes: 0, retweets: 0, comments: 0 });
    setDisplayEngagement({ likes: 0, retweets: 0, comments: 0 });
    setVisibleResponses([]);
    setAllResponsesLoaded(false);
    setTweetPosted(false);
  }

  function onRetrySituation() {
    // keep same level, clear tweet + ai + new random engagement on next submit
    setResponses(null);
    setEngagement({ likes: 0, retweets: 0, comments: 0 });
    setDisplayEngagement({ likes: 0, retweets: 0, comments: 0 });
    setVisibleResponses([]);
    setAllResponsesLoaded(false);
    setTweet("");
    setTweetPosted(false);
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
          {level && (
            <div className="mb-6 p-3" style={{ background: 'var(--border-blue)', border: '2px solid var(--foreground)' }}>
              <h2 className="text-sm font-bold mb-2">Current Situation:</h2>
              <p className="text-xs leading-relaxed">{level.level_prompt}</p>
            </div>
          )}

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
                  <img src="/avatar.png" alt="US President Avatar" className="w-10 h-10 rounded-full border-2 border-black mr-3" />
                  <div className="flex-1">
                    <div className="font-bold text-sm">President</div>
                    <div className="text-xs opacity-70">@USPresident</div>
                  </div>
                </div>
                <p className="text-sm mb-3">{tweet}</p>
                <div className="flex space-x-4 text-xs items-center">
                  <span className="flex items-center">
                    <img src="/images/like.png" alt="Likes" className="w-4 h-4 mr-1" />
                    {formatEngagement(displayEngagement.likes)}
                  </span>
                  <span className="flex items-center">
                    <img src="/images/comment.png" alt="Comments" className="w-4 h-4 mr-1" />
                    {formatEngagement(displayEngagement.comments)}
                  </span>
                  <span className="flex items-center">
                    <img src="/images/retweet.png" alt="Retweets" className="w-5 h-4 mr-1" />
                    {formatEngagement(displayEngagement.retweets)}
                  </span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="text-center mt-4 space-x-4">
                <button 
                  className="arcade-button"
                  onClick={onRetrySituation}
                >
                  retry
                </button>
                <button 
                  className="arcade-button"
                  onClick={onNextSituation}
                >
                  next situation
                </button>
              </div>
            </div>
          )}

          {/* GDP Counter - moved above World Leaders */}
          {tweetPosted && (
            <div className={`gdp-display ${gdpAnimating ? 'gdp-animated' : ''}`} style={{ position: 'relative', bottom: 'auto', right: 'auto', marginBottom: '20px' }}>
              ${displayGdp.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            </div>
          )}

          {/* Country Responses */}
          {responses && (
            <div className="mb-6">
              <h2 className="text-sm font-bold mb-3">World Leaders Respond:</h2>
              <div className="space-y-3">
                {visibleResponses.map((response, index) => (
                  <div key={`${response.country}-${index}`} className="tweet-box">
                    <div className="flex items-start mb-2">
                      <div className="mr-3">
                        <CountryAvatar country={response.country} size="md" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm">{response.country}</div>
                        <div className="text-xs opacity-70">Country Leader</div>
                      </div>
                    </div>
                    <p className="text-sm">{String(response.message)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rules Button */}
      <div className="text-center mt-4">
        <button
          onClick={() => setShowRules(true)}
          className="arcade-button"
          style={{ padding: '8px 16px', fontSize: '10px' }}
        >
          rules
        </button>
      </div>

      {/* Rules Popup */}
      {showRules && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'var(--border-blue)' }}>
          <div 
            className="arcade-container"
            style={{ 
              maxWidth: '500px', 
              margin: '20px',
              position: 'relative',
              background: 'var(--tweet-bg)',
              border: '3px solid var(--foreground)'
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowRules(false)}
              className="arcade-button"
              style={{ 
                position: 'absolute',
                top: '10px',
                right: '10px',
                padding: '4px 8px',
                fontSize: '8px',
                background: '#ff6b6b',
                color: 'white'
              }}
            >
              ✕
            </button>

            {/* Rules Content */}
            <div className="p-6" style={{ marginTop: '20px' }}>
              <h2 className="text-center text-lg font-bold mb-4" style={{ color: 'var(--foreground)' }}>
                How to play tweeter
              </h2>
              <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
                <p>
                  You are a powerful world leader and your influence is greatest via social media.
                </p>
                <p>
                  Respond to the current global situation however you like.
                </p>
                <p>
                  Your goal is to increase the value your country.
                </p>
              </div>
            </div>
          </div>
          </div>
        )}

      {/* Mute Button */}
      <div className="fixed bottom-4 left-4">
        <button
          onClick={toggleMute}
          className="arcade-button"
          style={{ 
            padding: '8px 12px', 
            fontSize: '8px',
            position: 'relative',
            background: isMuted ? '#ff6b6b' : 'var(--button-blue)',
            color: isMuted ? 'white' : 'var(--foreground)'
          }}
        >
          music
        </button>
      </div>

      {/* Version Indicator */}
      <div className="fixed bottom-4 right-4 text-xs opacity-60" style={{ color: 'var(--foreground)' }}>
        v0.1 BETA
      </div>

      {/* Audio Elements */}
      <audio ref={bgMusicRef} src="/music/bgmusic.wav" loop preload="auto" />
      <audio ref={pointsSoundRef} src="/music/points.mp3" preload="auto" />
    </main>
  );
}