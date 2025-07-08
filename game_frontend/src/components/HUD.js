import React from "react";

/**
 * PUBLIC_INTERFACE
 * HUD: Modern 3D-game-style heads-up display overlay.
 * - Shows score, health, status messages.
 * - Overlayed absolutely over the 3D canvas (z-index, no pointer events).
 * - Expects props: score (number), health (number), status (string or null).
 *
 * Example usage:
 *   <HUD score={score} health={health} status={status} />
 */
function HUD({ score = 0, health = 100, status }) {
  // Clamp and style health for bar
  const maxHealth = 100;
  const safeHealth = Math.max(0, Math.min(health, maxHealth));
  const healthPercent = (safeHealth / maxHealth) * 100;

  // Health bar color (green/red based on health)
  let barColor = "#38d39f";
  if (safeHealth <= 60) barColor = "#ecc94b";
  if (safeHealth <= 30) barColor = "#e53e3e";

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 30,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        userSelect: "none",
      }}
    >
      {/* Top HUD Row */}
      <div style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        padding: "min(4vw, 28px) min(4vw, 28px) 0 min(4vw, 28px)",
      }}>
        {/* Score */}
        <div style={{
          color: "var(--accent)",
          fontWeight: 800,
          fontSize: "clamp(1.3rem, 3vw, 2.2rem)",
          letterSpacing: ".045em",
          textShadow: "0 2px 12px #0009, 0 0px 3px var(--accent)",
          background: "var(--hud-glass)",
          borderRadius: 15,
          padding: "11px 26px 11px 22px",
          backdropFilter: "blur(3.5px)",
          boxShadow: "0 4px 18px #0003",
          minWidth: 110,
          border: "2.5px solid var(--accent)",
          filter: "drop-shadow(0 0 8px #e53e3e44)",
        }}>
          <span className="hud-label" style={{
            color: "#fafafa",
            fontWeight: 600,
            fontSize: "1rem",
            marginRight: 6,
            letterSpacing: ".03em"
          }}>Score:</span>
          {score}
        </div>
      </div>
      {/* Bottom HUD - Health bar and status */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        padding: "0 min(4vw, 28px) min(3vw, 24px)",
        width: "min(98vw, 365px)",
        maxWidth: "calc(100vw - 16px)",
      }}>
        {/* Health bar */}
        <div>
          <div style={{
            color: "#cbd5e1",
            fontWeight: 600,
            fontSize: "1rem",
            letterSpacing: ".015em",
            textShadow: "0 1px 7px #0008",
            marginBottom: 8,
            marginLeft: 2,
            opacity: 0.98
          }}>Health</div>
          <div style={{
            background: "linear-gradient(90deg, #232737 68%, #232737cc 100%)",
            borderRadius: 7,
            width: "min(90vw, 260px)",
            height: "18px",
            boxShadow: "0 1px 13px #0008",
            overflow: "hidden",
            border: "2px solid #394057",
            position: "relative"
          }}>
            <div style={{
              width: `${healthPercent}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${barColor} 80%, #111 120%)`,
              boxShadow: `0 0 15px ${barColor}aa`,
              transition: "width 0.25s cubic-bezier(.78,.34,.61,1.13),background .21s",
              borderTopLeftRadius: 7, borderBottomLeftRadius: 7,
            }} />
            <div
              style={{
                position: "absolute",
                right: 12, top: 2,
                fontSize: 11,
                color: "#fff",
                opacity: 0.76,
                fontWeight: 600,
                textShadow: "0 2px 6px #000",
                pointerEvents: "none"
              }}
            >
              {safeHealth}/100
            </div>
          </div>
        </div>
        {/* Status message, if any */}
        {status && (
          <div
            style={{
              marginTop: 23,
              color: "var(--accent)",
              background: "rgba(34,30,27,0.86)",
              fontSize: "clamp(1.0rem, 2.0vw, 1.3rem)",
              fontWeight: 700,
              borderRadius: 13,
              padding: "13px 30px",
              textShadow: "0 2px 9px #000b",
              letterSpacing: ".03em",
              boxShadow: "0 3px 14px #000a",
              border: "2.2px solid var(--accent)",
              alignSelf: "center",
              filter: "drop-shadow(0 2.5px 13px #e53e3e42)"
            }}
          >
            {status}
          </div>
        )}
      </div>
      {/* Global overlay HUD styles */}
      <style>{`
        @media (max-width: 700px) {
          .hud-label { font-size: 0.99rem !important; }
          div[style*='background: var(--hud-glass)'] {
            font-size: 4vw;
            padding: 9px 3vw 9px 3vw !important;
          }
          div[style*='border-radius: 7px'] { width: 82vw !important; }
        }
        @media (max-width: 420px) {
          div[style*='background: var(--hud-glass)'] { padding: 7px 3vw !important;}
          div[style*='width: min(98vw, 365px)'] { width: 98vw !important;}
        }
      `}</style>
    </div>
  );
}

export default HUD;
