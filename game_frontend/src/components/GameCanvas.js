import React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { usePlayerControls } from "../game/player";

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

// PUBLIC_INTERFACE
/**
 * GameCanvas sets up the 3D scene, including player controls, using react-three-fiber.
 * - PerspectiveCamera (fov 60, position set back and above)
 * - Lighting: ambient + directional with shadow
 * - Ground plane (large, gray)
 * - Player mesh using WASD & mouse for movement & aiming
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
      </Canvas>
    </div>
  );
}

export default GameCanvas;
