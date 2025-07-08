import React, { useEffect, useRef } from "react";
import { sound } from "../game/sound";

/**
 * PUBLIC_INTERFACE
 * Menu component: Displays game menus for pause, game over, and restart.
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

  useEffect(() => {
    if (open && !prevOpen.current) {
      // Menu just opened
      sound.playMenuOpen();
    }
    if (!open && prevOpen.current) {
      // Menu just closed
      sound.playMenuClose();
    }
    prevOpen.current = open;
  }, [open]);

  if (!open) return null;

  let title = "";
  let message = "";
  let actions = null;

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
        .menu-btn:hover, .menu-btn:focus {
          background: #ff8e44;
          color: #232737;
          transform: translateY(-2px) scale(1.03);
          box-shadow: 0 6px 24px #e87a417a;
        }
      `}</style>
    </div>
  );
}

export default Menu;
