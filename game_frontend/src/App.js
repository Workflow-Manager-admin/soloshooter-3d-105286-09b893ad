import React, { useState, useEffect } from "react";
import "./App.css";
import GameCanvas from "./components/GameCanvas";
import HomeScreen from "./components/HomeScreen";

/**
 * PUBLIC_INTERFACE
 * App is the main entry point. Renders the full game canvas or the home page.
 * Manages theme at the document level and game start state.
 * - GameCanvas fills the viewport *after* player starts.
 * - HomeScreen is shown by default.
 * - Theme toggle is always accessible and overlays atop all game UI.
 */
function App() {
  const [theme, setTheme] = useState("light");
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // PUBLIC_INTERFACE
  const handleStart = () => {
    setIsStarted(true);
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
      {/* Show home screen unless user has started game */}
      {!isStarted ? (
        <HomeScreen onStart={handleStart} />
      ) : (
        <GameCanvas />
      )}
    </div>
  );
}

export default App;
