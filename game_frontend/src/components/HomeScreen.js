import React from "react";

/**
 * PUBLIC_INTERFACE
 * HomeScreen
 * A full-screen home/landing screen for the 3D Shooter Game.
 * - Displays game title, description, and 'Start Game' button.
 * - Calls onStart when Start button is pressed.
 *
 * Props:
 *   - onStart: function to call when the Start Game button is clicked (required)
 */

function HomeScreen({ onStart }) {
  return (
    <div
      className="home-screen"
      style={{
        position: "fixed",
        inset: 0,
        background: "linear-gradient(120deg, #191d23 70%, #222 100%)",
        color: "var(--text-primary)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        zIndex: 3000,
        fontFamily: "inherit"
      }}
      data-testid="home-screen"
    >
      <div
        style={{
          background: "var(--ui-overlay-strong)",
          borderRadius: 20,
          boxShadow: "0 8px 40px #000a, 0 0 0 4px #1a1e2380",
          padding: "50px min(6vw,44px) 45px",
          textAlign: "center",
          minWidth: "min(84vw, 320px)",
        }}
      >
        <div
          style={{
            fontSize: "clamp(2.3rem,5vw,3.1rem)",
            fontWeight: 900,
            letterSpacing: ".023em",
            color: "var(--accent)",
            marginBottom: 11,
            textShadow: "0 1px 16px #000b"
          }}
        >
          🎯 Solo Shooter 3D
        </div>
        <div
          style={{
            color: "#e2e8f0",
            fontSize: "clamp(1.08rem,2.2vw,1.41rem)",
            marginBottom: 32,
            fontWeight: 400,
            letterSpacing: ".01em",
            textShadow: "0 1px 9px #000b",
            lineHeight: "1.25"
          }}
        >
          Test your aim in this immersive<br />
          single-player 3D shooting challenge.<br />
          <span style={{ color: "#ed8936" }}>
            Hit all targets for a high score, and try the moving boards!
          </span>
        </div>
        <button
          className="start-btn"
          style={{
            background: "var(--accent)",
            color: "#fff",
            fontSize: "clamp(1.25rem,2vw,1.6rem)",
            fontWeight: 800,
            border: "none",
            borderRadius: 18,
            padding: "19px 65px",
            cursor: "pointer",
            boxShadow: "0 4px 18px #e53e3e70",
            transition: "all 0.22s",
            outline: "none",
            filter: "drop-shadow(0 2.5px 16px #e53e3e33)"
          }}
          onClick={onStart}
          tabIndex={0}
          aria-label="Start Game"
        >
          Start Game
        </button>
        <div
          style={{
            marginTop: 30,
            color: "var(--text-secondary)",
            fontSize: "1.04rem",
            letterSpacing: ".01em",
            opacity: 0.8,
          }}
        >
          WASD/Arrows to move.<br />
          Mouse to aim & shoot.<br />
          ESC/P to pause, R to restart.
        </div>
      </div>
      <style>{`
        .start-btn:hover, .start-btn:focus-visible {
          background: #ff7c5a;
          color: #232737;
          transform: translateY(-2px) scale(1.06);
          box-shadow: 0 9px 27px #e53e3e67;
          outline: 3px solid #e87a41;
        }
        @media (max-width: 700px) {
          .home-screen > div { padding: 29px 2vw 20px !important; min-width: 94vw !important; }
          .start-btn { font-size: 1.13rem !important; padding: 10px 6vw; border-radius: 11px !important; }
        }
        @media (max-width: 420px) {
          .home-screen > div { padding: 7vw 1vw 5vw !important; }
          .start-btn { padding: 7px 3vw !important;}
        }
      `}</style>
    </div>
  );
}

export default HomeScreen;
