import React, { useRef, useEffect, useState, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
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
 * Streamlined, feature-integrated GameCanvas
 * - All state, audio, controls, overlays, leaderboard, and async flows
 */
function GameCanvas() {
  // Primary game state and manager refs
  const playerRef = usePlayerControls();
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState("loading"); // "loading"|"playing"|"paused"|"gameover"
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  // NPCs and Shooting
  const [npcSeed, setNPCSeed] = useState(0);
  const npcsRef = useRef([]);
  const shootingManagerRef = useRef(null);
  if (!shootingManagerRef.current) {
    shootingManagerRef.current = new ShootingManager();
  }
  const shootingManager = shootingManagerRef.current;

  // Asset preload (sound, images, models if any)
  useEffect(() => {
    let done = false;
    async function preloadAssets() {
      const soundPreloads = [];
      function awaitSoundLoad(howl) {
        return new Promise(resolve => {
          if (howl.state() === "loaded") return resolve();
          howl.once("load", () => resolve());
        });
      }
      if (sound && sound.sounds) {
        for (let key of Object.keys(sound.sounds)) {
          if (sound.sounds[key]?.state) {
            soundPreloads.push(awaitSoundLoad(sound.sounds[key]));
          }
        }
      }
      soundPreloads.push(new Promise(r => setTimeout(r, 250)));
      await Promise.all(soundPreloads);
      if (!done) {
        setLoading(false);
        setGameState("playing");
      }
    }
    preloadAssets();
    return () => { done = true; };
  }, []);

  // Reset game state (player, score, projectiles, NPCs)
  const resetGame = useCallback(() => {
    setScore(0);
    setGameState("playing");
    setStatus("");
    setNPCSeed(seed => seed + 1);
    if (playerRef && playerRef.player) {
      const p = playerRef.player.current;
      p.position = [0, 1, 0];
      p.health = 100;
      p.dir = { forward: 0, backward: 0, left: 0, right: 0 };
    }
    if (shootingManagerRef.current) shootingManagerRef.current.projectiles = [];
  }, [playerRef]);

  // Spawn NPCs on new seed (respawn or initial start)
  useEffect(() => {
    npcsRef.current = createNPCs(6, [0, 1, 0], 16);
    // Reset shooting manager projectiles for new session
    if (shootingManagerRef.current) shootingManagerRef.current.projectiles = [];
  }, [npcSeed]);

  const npcs = npcsRef.current || [];

  // Pause controls (use stable event listener to avoid stacking)
  useEffect(() => {
    function handlePauseAndRestart(e) {
      if (e.repeat) return;
      if (gameState === "playing") {
        if (e.code === "Escape" || e.code === "KeyP") setGameState("paused");
      } else if (gameState === "paused") {
        if (e.code === "Escape" || e.code === "KeyP") setGameState("playing");
        if (e.code === "KeyR") resetGame();
      } else if (gameState === "gameover") {
        if (e.code === "KeyR" || e.code === "Enter") resetGame();
      }
    }
    window.addEventListener("keydown", handlePauseAndRestart);
    return () => window.removeEventListener("keydown", handlePauseAndRestart);
  }, [gameState, resetGame]);

  // Unified mouse click shooting: only proceeds when playing
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

  // Main game frame loop for core logic, disables during overlays
  useFrame((_, delta) => {
    if (gameState !== "playing") return;
    // Projectiles/collision
    const killed = shootingManager.update(delta, npcs);
    if (killed && killed.length > 0) {
      setScore(prev => prev + killed.length);
      for (let i = 0; i < killed.length; ++i) {
        sound.playHit();
      }
    }

    // NPC attacks player when close (simple prototype logic)
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

  // Compute current player health (robust)
  const health = (
    playerRef && playerRef.player && playerRef.player.current
      ? playerRef.player.current.health || 100
      : 100
  );

  // Overlay interaction handlers:
  const handleResume = useCallback(() => {
    setGameState("playing");
    setStatus("");
  }, []);
  const handleRestart = useCallback(() => {
    resetGame();
  }, [resetGame]);

  // Always show loading overlay if assets/models/sfx not loaded
  if (loading || gameState === "loading") {
    return <LoadingScreen />;
  }

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#1a202c", position: "relative" }}>
      {/* 3D World */}
      <Canvas
        shadows
        camera={{ fov: 60, position: [0, 6, 10], near: 0.1, far: 100 }}
        style={{ width: "100%", height: "100%" }}
      >
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
        {/* Projectiles - cleanly managed by manager */}
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
