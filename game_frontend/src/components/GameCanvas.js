import React, { useRef, useState, useCallback, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { usePlayerControls } from "../game/player";
import { createNPCs, NPC_STATE } from "../game/npc";
import { ShootingManager, getPlayerAimDirection } from "../game/shooting";
import { sound } from "../game/sound";
import HUD from "./HUD";
import Menu from "./Menu";
import LoadingScreen from "./LoadingScreen";

/**
 * PlayerMesh renders the player's 3D visual and stays synced to logical position.
 */
function PlayerMesh({ playerRef }) {
  // Refs & hooks only allowed within Canvas. Hooks must remain here.
  // useFrame here rather than in parent.
  const { useFrame } = require("@react-three/fiber");
  useFrame((_, delta) => {
    if (playerRef && typeof playerRef.updatePlayer === "function") {
      playerRef.updatePlayer(delta);
    }
  });
  return (
    <mesh
      position={playerRef.player.current.position}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#e53e3e" />
    </mesh>
  );
}

/**
 * ProjectileMesh renders a projectile for visual shot feedback
 */
function ProjectileMesh({ projectile }) {
  const meshRef = useRef();
  useEffect(() => {
    projectile.meshRef = meshRef.current;
    if (meshRef.current)
      meshRef.current.position.set(...projectile.position);
  }, [projectile]);
  if (!projectile.active) return null;
  return (
    <mesh ref={meshRef} position={projectile.position} castShadow receiveShadow>
      <sphereGeometry args={[0.15, 12, 12]} />
      <meshStandardMaterial color="#61dafb" emissive="#61dafb" emissiveIntensity={0.8} />
    </mesh>
  );
}

/**
 * NPCMesh for each enemy AI agent in the scene
 */
function NPCMesh({ npc }) {
  const meshRef = useRef();
  useEffect(() => {
    npc.meshRef = meshRef.current;
  }, [npc]);
  if (npc.dead) return null;
  let color = npc.color;
  if (npc.state === NPC_STATE.CHASE) color = "#ecc94b";
  if (npc.state === NPC_STATE.ATTACK) color = "#e53e3e";
  return (
    <mesh ref={meshRef} position={npc.position} castShadow receiveShadow>
      <sphereGeometry args={[0.7, 16, 16]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

/**
 * NPCController - handles enemy AI logic per frame and meshes for all NPCs
 */
function NPCController({ playerRef, npcs, onUpdate }) {
  // Must be rendered in Canvas so can useFrame!
  const { useFrame } = require("@react-three/fiber");
  useFrame((_, delta) => {
    if (!playerRef?.player?.current) return;
    const playerPos = playerRef.player.current.position;
    npcs.forEach((npc) => npc.update(delta, playerPos));
    if (onUpdate) onUpdate();
  });

  return (
    <>
      {npcs.map((npc) => (
        <NPCMesh key={npc.id} npc={npc} />
      ))}
    </>
  );
}

/**
 * GameLoopController - Calls all gameplay logic per frame (projectiles, health, deaths, collisions)
 * This is the only useFrame for main logic; renders no mesh, but collects main side effects.
 * Must be a direct child of <Canvas>.
 */
function GameLoopController({
  gameState,
  setScore,
  setStatus,
  setGameState,
  playerRef,
  npcs,
  shootingManager
}) {
  const { useFrame } = require("@react-three/fiber");
  useFrame((_, delta) => {
    if (gameState !== "playing") return;
    // All projectile/NPC update and collision (returns list of killed NPC indices, triggers score+hit)
    const killed = shootingManager.update(delta, npcs);
    if (killed && killed.length > 0) {
      setScore((prev) => prev + killed.length);
      for (let i = 0; i < killed.length; ++i) {
        sound.playHit();
      }
    }
    if (playerRef && playerRef.player && playerRef.player.current) {
      const player = playerRef.player.current;
      for (const npc of npcs) {
        if (!npc || npc.dead) continue;
        const dx = npc.position[0] - player.position[0];
        const dz = npc.position[2] - player.position[2];
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 1.5 && !npc.dead) {
          player.health -= 19 * delta;
          if (player.health < 0) player.health = 0;
        }
      }
      if (player.health <= 0 && gameState !== "gameover") {
        setStatus("You were defeated!");
        setGameState("gameover");
      }
    }
  });
  return null;
}

/**
 * Streamlined, feature-integrated GameCanvas
 * - All state, audio, controls, overlays, leaderboard, and async flows
 */
function GameCanvas() {
  // All persistent refs/states for robust event/state handling
  const playerRef = usePlayerControls();
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState("loading"); // loading|playing|paused|gameover
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  // Controlled for force respawn on reset/seed
  const [npcSeed, setNPCSeed] = useState(0);
  const npcsRef = useRef([]);
  const shootingManagerRef = useRef(new ShootingManager());
  const shootingManager = shootingManagerRef.current;

  // Robust asset/sound preload phase
  useEffect(() => {
    let done = false;
    async function preloadAssets() {
      const soundPreloads = [];
      function awaitSoundLoad(howl) {
        // Prevent hanging for errored Howls. Resolve if loaded or error.
        return new Promise((resolve) => {
          if (!howl || typeof howl.state !== "function") return resolve();
          if (howl._srcError) return resolve();
          if (howl.state() === "loaded") return resolve();
          let settled = false;
          const finish = () => { if (!settled) { settled = true; resolve(); } };
          howl.once("load", finish);
          howl.once("loaderror", finish);
          // Also protect against Howler bugs
          setTimeout(finish, 1800); // fallback timeout in case event doesn't fire
        });
      }
      if (sound && sound.sounds) {
        for (let key of Object.keys(sound.sounds)) {
          if (sound.sounds[key]?.state) {
            soundPreloads.push(awaitSoundLoad(sound.sounds[key]));
          }
        }
      }
      // Always allow loading to "finish" after a reasonable minimum
      soundPreloads.push(new Promise((r) => setTimeout(r, 250)));
      await Promise.all(soundPreloads);
      if (!done) {
        setLoading(false);
        setGameState("playing");
      }
    }
    preloadAssets();
    return () => {
      done = true;
    };
  }, []);

  // Full state reset: all logic, refs, positions
  const resetGame = useCallback(() => {
    setScore(0);
    setGameState("playing");
    setStatus("");
    setNPCSeed((s) => s + 1);
    if (playerRef && playerRef.player && playerRef.player.current) {
      const p = playerRef.player.current;
      p.position = [0, 1, 0];
      p.health = 100;
      if (p.dir) {
        p.dir.forward = 0; p.dir.backward = 0; p.dir.left = 0; p.dir.right = 0;
      }
    }
    if (shootingManagerRef.current) {
      shootingManagerRef.current.projectiles = [];
    }
  }, [playerRef]);

  // Robust NPC/Projectile respawn on seed change
  useEffect(() => {
    npcsRef.current = createNPCs(6, [0, 1, 0], 16);
    shootingManagerRef.current.projectiles = [];
  }, [npcSeed]);

  const npcs = npcsRef.current;

  // KEYBOARD event handler: game state, restart, overlays, robust removal/add
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.repeat) return;
      if (gameState === "playing") {
        if (e.code === "Escape" || e.code === "KeyP") {
          setGameState("paused");
        }
      } else if (gameState === "paused") {
        if (e.code === "Escape" || e.code === "KeyP") {
          setGameState("playing");
        }
        if (e.code === "KeyR") {
          resetGame();
        }
      } else if (gameState === "gameover") {
        if (e.code === "KeyR" || e.code === "Enter") {
          resetGame();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, resetGame]);

  // MOUSE shooting handler: only listens while in "playing" state
  useEffect(() => {
    function handleMouseDown(e) {
      if (gameState !== "playing") return;
      if (e.button !== 0) return;
      const player = playerRef.player.current;
      const aimDir = getPlayerAimDirection(player);
      const result = shootingManager.shoot([...player.position], aimDir, performance.now() / 1000);
      if (result) sound.playShoot();
    }
    window.addEventListener("mousedown", handleMouseDown);
    return () => window.removeEventListener("mousedown", handleMouseDown);
  }, [gameState, shootingManager, playerRef]);

  // Robust health querying
  const health = (
    playerRef && playerRef.player && playerRef.player.current
      ? playerRef.player.current.health || 100
      : 100
  );

  // Overlay interaction handlers
  const handleResume = useCallback(() => {
    setGameState("playing");
    setStatus("");
  }, []);
  const handleRestart = useCallback(() => {
    resetGame();
  }, [resetGame]);

  // Loading overlay always on if not loaded
  if (loading || gameState === "loading") {
    return <LoadingScreen />;
  }

  // Core render: full 3D/CSS overlays
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#1a202c", position: "relative" }}>
      {/* 3D World */}
      <Canvas
        shadows
        camera={{ fov: 60, position: [0, 6, 10], near: 0.1, far: 100 }}
        style={{ width: "100%", height: "100%" }}
      >
        {/* In-Canvas logic wrapper to safely use useFrame */}
        <GameLoopController
          gameState={gameState}
          setScore={setScore}
          setStatus={setStatus}
          setGameState={setGameState}
          playerRef={playerRef}
          npcs={npcs}
          shootingManager={shootingManager}
        />
        {/* Ambient + Directional Lights */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[4, 10, 8]}
          intensity={1.1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        {/* Ground plane */}
        <mesh
          receiveShadow
          rotation-x={-Math.PI / 2}
          position={[0, 0, 0]}
        >
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#4a5568" />
        </mesh>
        {/* Player character */}
        <PlayerMesh playerRef={playerRef} />
        {/* NPCs - spawn/AI */}
        <NPCController playerRef={playerRef} npcs={npcs} />
        {/* Projectiles - cleanly managed */}
        {shootingManager.projectiles.map((proj) =>
          proj.active ? <ProjectileMesh key={proj.id} projectile={proj} /> : null
        )}
      </Canvas>
      {/* HUD: score/health only during gameplay */}
      {gameState === "playing" && (
        <HUD score={score} health={health} status={status} />
      )}
      {/* Overlay for Paused/Game Over with leaderboard integration */}
      <Menu
        open={gameState === "paused" || gameState === "gameover"}
        mode={gameState === "paused" ? "pause" : "gameover"}
        onResume={gameState === "paused" ? handleResume : undefined}
        onRestart={handleRestart}
        score={score}
      />
    </div>
  );
}

export default GameCanvas;
