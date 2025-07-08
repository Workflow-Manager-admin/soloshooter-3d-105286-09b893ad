import React, { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { usePlayerControls } from "../game/player";
import { createNPCs, NPC_STATE } from "../game/npc";

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
 * NPCMesh renders a single NPC in the scene and updates its mesh reference for position sync.
 */
function NPCMesh({ npc }) {
  // Use a local ref to store the mesh, link it to npc instance for .update()
  const meshRef = useRef();
  useEffect(() => {
    npc.meshRef = meshRef.current;
  }, [npc]);
  // Choose color by state for visualization
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
 */
function NPCController({ playerRef }) {
  // Initialize NPCs only once for the session
  const npcsRef = useRef(null);
  if (!npcsRef.current) {
    // Spawn some NPCs spread across the plane
    npcsRef.current = createNPCs(6, [0, 1, 0], 16);
  }
  const npcs = npcsRef.current;

  // Update all NPCs every frame
  useFrame((_, delta) => {
    if (!playerRef?.player?.current) return;
    const playerPos = playerRef.player.current.position;
    npcs.forEach((npc) => npc.update(delta, playerPos));
  });

  return (
    <>
      {npcs.map((npc) => (
        <NPCMesh key={npc.id} npc={npc} />
      ))}
    </>
  );
}

// PUBLIC_INTERFACE
/**
 * GameCanvas sets up the 3D scene, including player controls and NPCs, using react-three-fiber.
 * - PerspectiveCamera (fov 60, position set back and above)
 * - Lighting: ambient + directional with shadow
 * - Ground plane (large, gray)
 * - Player mesh using WASD & mouse for movement & aiming
 * - NPCs with basic AI behaviors and colored state
 */
function GameCanvas() {
  const playerRef = usePlayerControls();

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
        {/* NPCs with AI */}
        <NPCController playerRef={playerRef} />
      </Canvas>
    </div>
  );
}

export default GameCanvas;
