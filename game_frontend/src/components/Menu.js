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
        background: "rgba(10,12,18,0.92)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      <div
        style={{
          background: "rgba(34,37,51,0.94)",
          borderRadius: 18,
          padding: "44px 60px 38px",
          boxShadow: "0 4px 32px #000a",
          minWidth: 310,
          textAlign: "center",
          border: "2.5px solid #e87a41",
        }}
      >
        <div style={{
          fontSize: 38,
          fontWeight: 900,
          letterSpacing: ".03em",
          color: "#ffc97b",
          marginBottom: 22,
          textShadow: "0 1px 12px #000a",
        }}>{title}</div>
        <div style={{
          color: "#edf2f7",
          fontSize: 21,
          marginBottom: 34,
          fontWeight: 500,
          letterSpacing: ".015em"
        }}>{message}</div>
        <div style={{ display: "flex", gap: 18, justifyContent: "center" }}>
          {actions}
        </div>
        {leaderboardSection}
      </div>
      {/* Menu Buttons CSS */}
      <style>{`
        .menu-btn {
          background: #e87a41;
          color: #fff;
          font-size: 20px;
          font-weight: 700;
          border: none;
          border-radius: 10px;
          padding: 13px 34px;
          margin: 0 5px;
          cursor: pointer;
          box-shadow: 0 2px 10px #0005;
          transition: all 0.18s;
          outline: none;
        }
        .menu-btn:disabled {
          cursor: not-allowed;
          background: #c0bdb1;
        }
        .menu-btn:hover:not(:disabled), .menu-btn:focus:not(:disabled) {
          background: #ff8e44;
          color: #232737;
          transform: translateY(-2px) scale(1.03);
          box-shadow: 0 6px 24px #e87a417a;
        }
        input[type="text"] {
          transition: background 0.19s, color 0.15s;
        }
      `}</style>
    </div>
  );
}

export default Menu;
