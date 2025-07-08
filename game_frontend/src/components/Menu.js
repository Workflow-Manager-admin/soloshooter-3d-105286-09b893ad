import React, { useEffect, useRef, useState } from "react";
import { sound } from "../game/sound";
import { saveHighScore, getLeaderboard } from "../utils/supabase";

/**
 * PUBLIC_INTERFACE
 * Menu component: Displays game menus for pause, game over, and restart.
 * Adds integration with Supabase for leaderboard on Game Over.
 * 
 * Props:
 *  - open: boolean. If true, menu is visible.
 *  - mode: "pause" | "gameover". Menu type to show.
 *  - onResume: Function to resume the game.
 *  - onRestart: Function to restart the game.
 *  - score: Number (optional) - Final score, displayed on game over.
 *  - style: Optional container style overrides.
 * 
 * Usage:
 *   <Menu open={isPaused} mode="pause" onResume={resumeGame} onRestart={restartGame} score={score}/>
 */
function Menu({ open, mode, onResume, onRestart, score, style }) {
  // Track previous open state to play open/close sounds
  const prevOpen = useRef(false);

  // State and effect for leaderboard, username
  const [playerName, setPlayerName] = useState("");
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoadError, setLeaderboardLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Play open/close sfx
  useEffect(() => {
    if (open && !prevOpen.current) {
      sound.playMenuOpen();
    }
    if (!open && prevOpen.current) {
      sound.playMenuClose();
    }
    prevOpen.current = open;
    // Clear state when closing
    if (!open) {
      setScoreSubmitted(false);
      setPlayerName("");
      setLeaderboard([]);
      setLeaderboardLoadError("");
      setSubmitting(false);
    }
  }, [open]);

  // On gameover open, fetch leaderboard
  useEffect(() => {
    if (mode === "gameover" && open) {
      getLeaderboard().then(({ data, error }) => {
        if (error) setLeaderboardLoadError("Failed to load leaderboard.");
        if (data) setLeaderboard(data);
      });
    }
  }, [mode, open, scoreSubmitted]);

  // Handle name input
  function handleNameChange(e) {
    setPlayerName(e.target.value.slice(0, 16));
  }

  // Handle submit highscore
  async function handleScoreSubmit() {
    if (!playerName.trim() || typeof score !== "number") return;
    setSubmitting(true);
    await saveHighScore(playerName.trim(), score);
    setScoreSubmitted(true);
    setSubmitting(false);
    // reload leaderboard will be triggered by effect
  }

  if (!open) return null;

  let title = "";
  let message = "";
  let actions = null;
  let leaderboardSection = null;

  if (mode === "pause") {
    title = "Paused";
    message = "The game is paused. Take a break!";
    actions = (
      <>
        <button className="menu-btn" onClick={onResume}>Resume</button>
        <button className="menu-btn" onClick={onRestart}>Restart</button>
      </>
    );
  } else if (mode === "gameover") {
    title = "Game Over";
    message = (
      <>
        Your Score: <span style={{ color: "#e87a41", fontWeight: 600 }}>{score}</span>
      </>
    );
    actions = (
      <>
        <button className="menu-btn" onClick={onRestart}>Restart</button>
      </>
    );
    leaderboardSection = (
      <div style={{
        marginTop: 32,
        background: "rgba(28,25,22,0.88)",
        borderRadius: 10,
        padding: "18px 18px 14px",
        width: 280,
        marginLeft: "auto",
        marginRight: "auto",
        boxShadow: "0 2px 18px #0006"
      }}>
        <div style={{
          color: "#ffc97b", fontWeight: 700, fontSize: 21,
          letterSpacing: ".02em", marginBottom: 10
        }}>Leaderboard</div>
        {leaderboardLoadError && (
          <div style={{ color: "#e53e3e", marginBottom: 6 }}>
            {leaderboardLoadError}
          </div>
        )}
        <ol style={{
          color: "#fff", fontSize: 17, margin: 0,
          paddingLeft: 12, paddingBottom: 6, minHeight: 35
        }}>
          {leaderboard && leaderboard.length > 0 ?
            leaderboard.map((entry, idx) => (
              <li key={`${entry.player}_${entry.score}_${entry.created_at}`} style={{
                marginBottom: 1,
                color: idx === 0 ? "#ed8936" : idx === 1 ? "#ffc97b" : idx === 2 ? "#e2e8f0" : "#fff",
                fontWeight: idx < 3 ? 700 : 400,
              }}>
                <span style={{ marginRight: 7 }}>{entry.player}</span>
                <span style={{ float: "right", fontWeight: 600 }}>{entry.score}</span>
              </li>
            ))
            : <li>Be the first to join the leaderboard!</li>}
        </ol>
        {!scoreSubmitted && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 7 }}>
            <input
              type="text"
              value={playerName}
              onChange={handleNameChange}
              maxLength={16}
              placeholder="Your name"
              style={{
                width: "calc(100% - 8px)", padding: 7, borderRadius: 5,
                fontWeight: 500, fontSize: 16, border: "1px solid #394057",
                background: "#22242b", color: "#fafafa", outline: "none"
              }}
              disabled={submitting}
              autoFocus
            />
            <button
              className="menu-btn"
              disabled={submitting || !playerName.trim()}
              style={{ fontSize: 17, padding: "7px 0", borderRadius: 7 }}
              onClick={handleScoreSubmit}
            >{submitting ? "Submitting..." : "Submit Score"}</button>
          </div>
        )}
        {scoreSubmitted && (
          <div style={{
            marginTop: 13, color: "#38d39f", fontSize: 15, fontWeight: 600
          }}>
            Score submitted!
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="menu-overlay"
      style={{
        position: "fixed",
        zIndex: 1000,
        inset: 0,
        background: "linear-gradient(120deg, #17181d99 22%, #171b1e 88%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      <div
        style={{
          background: "var(--ui-overlay-strong)",
          borderRadius: 22,
          padding: "40px min(11vw,70px) 38px",
          boxShadow: "0 8px 38px #000b, 0 0 0 4px #1a1e2390",
          minWidth: "min(84vw, 320px)",
          textAlign: "center",
          border: "3.5px solid var(--accent)",
          filter: "drop-shadow(0 2.5px 12px #e53e3e44)",
          maxWidth: 520,
        }}
      >
        <div style={{
          fontSize: "clamp(2.1rem,4vw,2.9rem)",
          fontWeight: 900,
          letterSpacing: ".023em",
          color: "#ffc97b",
          marginBottom: 18,
          textShadow: "0 1px 20px #000b,0 1.5px 12px #f5e5b660",
          lineHeight: 1.12,
        }}>{title}</div>
        <div style={{
          color: "#e2e8f0",
          fontSize: "clamp(1.2rem,2.2vw,1.47rem)",
          marginBottom: 28,
          fontWeight: 500,
          letterSpacing: ".01em",
          textShadow: "0 1px 4px #000b",
          lineHeight: "1.25"
        }}>{message}</div>
        <div style={{ display: "flex", gap: 18, justifyContent: "center" }}>
          {actions}
        </div>
        {leaderboardSection}
      </div>
      {/* Menu Buttons CSS and overlay styles */}
      <style>{`
        .menu-btn {
          background: var(--accent);
          color: #fff;
          font-size: 1.3rem;
          font-weight: 800;
          border: none;
          border-radius: 13px;
          padding: 13px 33px;
          margin: 0 5px;
          cursor: pointer;
          box-shadow: 0 3px 18px #0006, 0 0.3px 0.3px #e53e3e66;
          transition: all 0.18s;
          outline: none;
          letter-spacing: .01em;
          filter: drop-shadow(0 1.5px 11px #e53e3e25)
        }
        .menu-btn:disabled {
          cursor: not-allowed;
          background: #c0bdb1 !important;
          color: #929292 !important;
        }
        .menu-btn:hover:not(:disabled), .menu-btn:focus-visible:not(:disabled) {
          background: #ff7c5a;
          color: #232737;
          transform: translateY(-2px) scale(1.045);
          box-shadow: 0 9px 27px #e53e3e67;
          outline: 2.5px solid #ff7c5a66;
        }
        input[type="text"] {
          transition: background 0.19s, color 0.15s, border 0.15s;
          border: 1.8px solid #394057;
          background: #232737;
          color: #f8f6f9;
        }
        .menu-overlay {
          /* immersive glass, backdrop - if supported */
          backdrop-filter: blur(4.5px);
        }
        @media (max-width: 700px) {
          .menu-overlay > div {
            padding: 24px 2vw 27px !important;
            min-width: 92vw !important;
            max-width: 99vw !important;
            border-radius: 16px !important;
          }
          .menu-btn { font-size: 1.09rem !important; padding: 12px 7vw; border-radius: 10px !important; }
        }
        @media (max-width: 420px) {
          .menu-overlay > div { padding: 9vw 2vw 6vw !important; }
          .menu-btn { padding: 7px 3vw !important;}
        }
      `}</style>
    </div>
  );
}

export default Menu;
