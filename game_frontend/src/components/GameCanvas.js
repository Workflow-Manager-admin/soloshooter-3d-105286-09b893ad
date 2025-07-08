import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

// PUBLIC_INTERFACE
/**
 * GameCanvas sets up the 3D scene using react-three-fiber.
 * It includes a PerspectiveCamera, basic lighting, a ground plane, and a placeholder box.
 * This component serves as the main 3D game area for Soloshooter.
 */
function RotatingBox(props) {
  // A simple placeholder animated box for demonstration
  const ref = useRef();
  useFrame((state, delta) => {
    ref.current.rotation.y += delta * 0.6;
    ref.current.rotation.x += delta * 0.3;
  });
  return (
    <mesh ref={ref} position={[0, 1, 0]} {...props} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#e53e3e" />
    </mesh>
  );
}

// PUBLIC_INTERFACE
function GameCanvas() {
  /**
   * Renders the main 3D scene using @react-three/fiber.
   * - PerspectiveCamera (fov 60, position set back and above)
   * - Lighting: ambient + directional with shadow
   * - Ground plane (large, gray)
   * - Placeholder box in the center
   */
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
        {/* Placeholder object for game entity */}
        <RotatingBox />
      </Canvas>
    </div>
  );
}

export default GameCanvas;
