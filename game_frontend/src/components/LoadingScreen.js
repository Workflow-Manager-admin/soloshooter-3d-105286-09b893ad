import React from "react";

/**
 * PUBLIC_INTERFACE
 * LoadingScreen - Shows an animated loading spinner and placeholder text while assets/models are being loaded.
 * Responsive, theme-adapting design for fullscreen overlay.
 * 
 * Props:
 * - message: (optional) custom loading message string
 * Usage:
 *   <LoadingScreen message="Loading game assets..." />
 */
function LoadingScreen({ message = "Loading assets and game models..." }) {
  return (
    <div
      className="loading-screen"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2500,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(120deg, #17181de6 10%, #1a202ce0 100%)",
        color: "var(--text-primary)",
        fontFamily: "inherit",
        width: "100vw",
        height: "100vh",
        transition: "opacity 0.38s cubic-bezier(.62,.13,.41,.97)"
      }}
      data-testid="loading-overlay"
    >
      {/* Animated spinner */}
      <div style={{
        marginBottom: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div className="loading-spinner-outer" style={{
          width: 74,
          height: 74,
          borderRadius: "50%",
          border: "6px solid var(--border-color)",
          borderTop: "6px solid var(--accent)",
          animation: "spin 1.3s linear infinite"
        }} />
        <style>{`
          @keyframes spin {
            to {transform: rotate(360deg);}
          }
        `}</style>
      </div>
      {/* Loading message */}
      <div style={{
        fontSize: "clamp(1.15rem,2.8vw,1.43rem)",
        fontWeight: 600,
        letterSpacing: ".025em",
        color: "var(--accent)",
        marginBottom: 8,
        textShadow: "0 2px 10px #000b"
      }}>
        {message}
      </div>
      {/* Placeholder tips or progress */}
      <div style={{
        fontSize: "1rem",
        color: "var(--text-secondary)",
        marginTop: 10,
        letterSpacing: ".02em",
        maxWidth: 420,
        textAlign: "center"
      }}>
        Please wait while models, textures & sounds are preloaded for optimal gameplay experience.
      </div>
      {/* Responsive tweaks */}
      <style>{`
        @media (max-width: 650px) {
          .loading-screen > div { font-size: 1.02rem !important; }
          .loading-spinner-outer { width: 48px !important; height: 48px !important; }
        }
        @media (max-width: 400px) {
          .loading-screen { font-size: 0.97rem !important; }
        }
      `}</style>
    </div>
  );
}

export default LoadingScreen;
