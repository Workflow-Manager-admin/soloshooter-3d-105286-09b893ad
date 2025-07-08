import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { usePlayerControls } from "../game/player";
import { createNPCs, NPC_STATE } from "../game/npc";
import { ShootingManager, getPlayerAimDirection } from "../game/shooting";
import { sound } from "../game/sound";
import HUD from "./HUD";
import Menu from "./Menu";
import LoadingScreen from "./LoadingScreen";

/**
 * PlayerMesh renders the player's visual representation and updates movement each frame.
 */
function PlayerMesh({ playerRef }) {
  useFrame((_, delta) => {
    if (playerRef && typeof playerRef.updatePlayer === "function") {
      playerRef.updatePlayer(delta);
    }
  });

  // Player mesh follows the player's logical position
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
 * ProjectileMesh renders a single projectile (e.g. a bullet or orb)
 */
function ProjectileMesh({ projectile }) {
  // Mesh ref for visual sync
  const meshRef = useRef();
  useEffect(() => {
    projectile.meshRef = meshRef.current;
    if (meshRef.current)
      meshRef.current.position.set(...projectile.position);
  }, [projectile]);
  if (!projectile.active) return null;
  // Appear as a glowing small sphere
  return (
    <mesh ref={meshRef} position={projectile.position} castShadow receiveShadow>
      <sphereGeometry args={[0.15, 12, 12]} />
      <meshStandardMaterial color="#61dafb" emissive="#61dafb" emissiveIntensity={0.8} />
    </mesh>
  );
}

/**
 * NPCMesh renders a single NPC in the scene and updates its mesh reference for position sync.
 * Now will skip if npc.dead=true
 */
function NPCMesh({ npc }) {
  const meshRef = useRef();
  useEffect(() => {
    npc.meshRef = meshRef.current;
  }, [npc]);
  if (npc.dead) return null;
  let color = npc.color;
  if (npc.state === NPC_STATE.CHASE) color = "#ecc94b"; // yellow for chase
  if (npc.state === NPC_STATE.ATTACK) color = "#e53e3e"; // accent for attack

  return (
    <mesh ref={meshRef} position={npc.position} castShadow receiveShadow>
      <sphereGeometry args={[0.7, 16, 16]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

/**
 * Handles NPC AI updates and rendering within the React scene.
 * Accepts an optional onUpdate callback to inform parent of state changes.
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
 * GameCanvas: full 3D scene, player/game/NPC logic, handles:
 *  - Mouse shooting with projectiles
 *  - Pause, Game Over, and Restart logic/overlays
 *  - Modern HUD and menu overlays
 */
function GameCanvas() {
  const playerRef = usePlayerControls();

  // Local state for score and game logic
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState("playing"); // "playing", "paused", "gameover"
  const [status, setStatus] = useState("");

  // Asset loading state logic
  const [loading, setLoading] = useState(true);

  // List of asset/sound preloads (add models, images here if needed)
  useEffect(() => {
    let done = false;
    async function preloadAssets() {
      // Preload sounds
      // Register onload listeners so we detect when all needed are loaded
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
      // NOTE: add similar awaits for models or textures (via their loaders, if preloading is needed)
      // Simulate minimal wait for demo (remove in prod)
      soundPreloads.push(new Promise(r => setTimeout(r, 250)));
      await Promise.all(soundPreloads);
      if (!done) setLoading(false);
    }
    preloadAssets();
    return () => { done = true; };
  }, []);

  // SPAWN NPC SET (reset on restart)
  const [npcSeed, setNPCSeed] = useState(0);
  const npcsRef = useRef(null);

  // Game reset
  function resetGame() {
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
  }

  // SPAWN/reset NPCs when npcSeed increments
  useEffect(() => {
    npcsRef.current = createNPCs(6, [0, 1, 0], 16);
  }, [npcSeed]);
  const npcs = npcsRef.current || [];

  const shootingManagerRef = useRef(null);
  if (!shootingManagerRef.current) {
    shootingManagerRef.current = new ShootingManager();
  }
  const shootingManager = shootingManagerRef.current;

  // Game paused disables shooting/movement logic
  const isPaused = gameState === "paused" || gameState === "gameover";

  // Mouse - left-click shoots (only if not paused/gameover)
  useEffect(() => {
    function handleMouseDown(e) {
      if (isPaused) return;
      if (e.button !== 0) return; // left mouse only
      const player = playerRef.player.current;
      const aimDir = getPlayerAimDirection(player);
      const result = shootingManager.shoot([...player.position], aimDir, performance.now() / 1000);
      if (result) sound.playShoot();
    }
    window.addEventListener("mousedown", handleMouseDown);
    return () => window.removeEventListener("mousedown", handleMouseDown);
  }, [playerRef, shootingManager, isPaused]);

  // Keyboard - ESC/p pauses, ESC/p resumes from pause, R restarts if paused/gameover, ENTER restarts from gameover
  useEffect(() => {
    function handleKeyDown(e) {
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
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState]);

  // Main game frame updates (skip if paused/gameover)
  useFrame((_, delta) => {
    if (isPaused) return;
    // Update projectiles/collision
    const killed = shootingManager.update(delta, npcs);
    if (killed && killed.length > 0) {
      setScore(prev => prev + killed.length);
      // Play hit sound for each NPC defeated
      for (let i = 0; i < killed.length; ++i) {
        sound.playHit();
      }
    }

    // Simple NPC "attack" stub: any NPC close damages player
    if (playerRef && playerRef.player && playerRef.player.current) {
      const player = playerRef.player.current;
      for (const npc of npcs) {
        if (!npc || npc.dead) continue;
        const dx = npc.position[0] - player.position[0];
        const dz = npc.position[2] - player.position[2];
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 1.5 && !npc.dead) {
          player.health -= 19 * delta; // quick for demo, tune as needed
          if (player.health < 0) player.health = 0;
        }
      }
      if (player.health <= 0 && gameState !== "gameover") {
        setStatus("You were defeated!");
        setGameState("gameover");
      }
    }
  });

  const health =
    playerRef && playerRef.player && playerRef.player.current
      ? playerRef.player.current.health || 100
      : 100;

  function handleResume() {
    setGameState("playing");
    setStatus("");
  }
  function handleRestart() {
    resetGame();
  }

  // Show loading overlay if assets not ready
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#1a202c", position: "relative" }}>
      <Canvas
        shadows
        camera={{ fov: 60, position: [0, 6, 10], near: 0.1, far: 100 }}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[4, 10, 8]}
          intensity={1.1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        {/* Ground Plane */}
        <mesh
          receiveShadow
          rotation-x={-Math.PI / 2}
          position={[0, 0, 0]}
        >
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#4a5568" />
        </mesh>
        {/* Player mesh with controls */}
        <PlayerMesh playerRef={playerRef} />
        {/* NPCs with AI & removal if dead */}
        <NPCController playerRef={playerRef} npcs={npcs} />
        {/* Projectiles rendering */}
        {shootingManager.projectiles.map((proj) =>
          proj.active ? <ProjectileMesh key={proj.id} projectile={proj} /> : null
        )}
      </Canvas>
      {/* HUD only if playing */}
      {gameState === "playing" && (<HUD score={score} health={health} status={status} />)}
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
