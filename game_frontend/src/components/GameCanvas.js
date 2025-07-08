import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { usePlayerControls } from "../game/player";
import { createNPCs, NPC_STATE } from "../game/npc";
import { ShootingManager, getPlayerAimDirection } from "../game/shooting";
import HUD from "./HUD";

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
 * GameCanvas sets up the 3D scene, including player controls, projectiles, and NPCs, using react-three-fiber.
 * Now implements:
 *  - Mouse shooting with projectiles
 *  - Projectile movement and rendering
 *  - Collision detection with NPCs (NPCs destroyed on hit, score updated)
 *  - Player/NPC updates as before
 */
function GameCanvas() {
  const playerRef = usePlayerControls();

  // Use refs/state for NPCs, projectiles, and shooting manager
  const [score, setScore] = useState(0);

  // Spawn NPCs once
  const npcsRef = useRef(null);
  if (!npcsRef.current) {
    npcsRef.current = createNPCs(6, [0, 1, 0], 16);
  }
  const npcs = npcsRef.current;

  // One shooting manager for the session
  const shootingManagerRef = useRef(null);
  if (!shootingManagerRef.current) {
    shootingManagerRef.current = new ShootingManager();
  }
  const shootingManager = shootingManagerRef.current;

  // Mouse handling for firing - click shoots
  useEffect(() => {
    function handleMouseDown(e) {
      if (e.button !== 0) return; // left mouse only
      const player = playerRef.player.current;
      // Use getPlayerAimDirection for now - movement-based aiming
      const aimDir = getPlayerAimDirection(player);
      // Place projectile at player's current position
      const shot = shootingManager.shoot([...player.position], aimDir, performance.now() / 1000);
      // gun sound or muzzle flash can be added here
    }
    window.addEventListener("mousedown", handleMouseDown);
    return () => window.removeEventListener("mousedown", handleMouseDown);
  }, [playerRef, shootingManager]);

  // Master frame update for projectiles and collision with NPCs
  useFrame((_, delta) => {
    // Update projectiles & collision
    const killed = shootingManager.update(delta, npcs);
    if (killed && killed.length > 0) {
      setScore((prev) => prev + killed.length);
    }
  });

  // Extract player health from player ref, fallback to 100 if unavailable
  const health =
    playerRef && playerRef.player && playerRef.player.current
      ? playerRef.player.current.health || 100
      : 100;

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#1a202c" }}>
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
      {/* Modern HUD overlay */}
      <HUD score={score} health={health} status={""} />
    </div>
  );
}

export default GameCanvas;
