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
      {/* Top row HUD */}
      <div style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        padding: 24,
      }}>
        {/* Score */}
        <div style={{
          color: "#fff",
          fontWeight: 800,
          fontSize: 28,
          letterSpacing: ".045em",
          textShadow: "0 2px 10px #000, 0 0px 2px #e87a41",
          background: "rgba(26,32,44,0.72)",
          borderRadius: 10,
          padding: "7px 20px 7px 18px",
          boxShadow: "0 2px 10px #0002",
          minWidth: 110,
        }}>
          Score: {score}
        </div>
      </div>
      {/* Bottom HUD - Health bar and status */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        padding: 24,
        width: "360px",
        maxWidth: "90vw",
      }}>
        {/* Health bar */}
        <div>
          <div style={{
            color: "#fff",
            fontWeight: 600,
            fontSize: 18,
            letterSpacing: ".025em",
            textShadow: "0 1px 8px #0008",
            marginBottom: 8,
          }}>Health</div>
          <div style={{
            background: "#232737",
            borderRadius: 7,
            width: "240px",
            height: "20px",
            boxShadow: "0 1px 6px #0007",
            overflow: "hidden",
            border: "1.5px solid #3a3d4f"
          }}>
            <div style={{
              width: `${healthPercent}%`,
              height: "100%",
              background: barColor,
              boxShadow: "0 0 7px #1fffce99",
              transition: "width 0.23s cubic-bezier(.78,.34,.61,1.13),background .21s",
            }} />
          </div>
          <div
            style={{
              position: "absolute",
              fontSize: 13,
              color: "#fff",
              left: 28,
              bottom: 36,
              opacity: 0.8,
              textShadow: "0 1px 4px #000"
            }}
          >
            {safeHealth}/100
          </div>
        </div>
        {/* Status message, if any */}
        {status && (
          <div
            style={{
              marginTop: 24,
              color: "#e87a41",
              background: "rgba(42,34,24,0.85)",
              fontSize: 21,
              fontWeight: 700,
              borderRadius: 9,
              padding: "10px 28px",
              textShadow: "0 2px 8px #0009",
              letterSpacing: ".04em",
              boxShadow: "0 1px 6px #0005"
            }}
          >
            {status}
          </div>
        )}
      </div>
    </div>
  );
}

export default HUD;
