import React, { useState, useEffect } from "react";
import "./App.css";
import GameCanvas from "./components/GameCanvas";

/**
 * PUBLIC_INTERFACE
 * App is the main entry point. Renders the full game canvas and
 * manages theme at the document level.
 * - GameCanvas always fills the viewport.
 * - Theme toggle is always accessible and overlays atop all game UI.
 */
function App() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <div className="App" style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {/* Theme toggle overlays the top right, always accessible */}
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 2000,
        }}
      >
        {theme === "light" ? "🌙 Dark" : "☀️ Light"}
      </button>
      {/* Core game + overlays handled by GameCanvas */}
      <GameCanvas />
    </div>
  );
}

export default App;
