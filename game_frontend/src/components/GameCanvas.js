import React, { useRef, useState, useCallback, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { usePlayerControls } from "../game/player";
import { sound } from "../game/sound";
import HUD from "./HUD";
import Menu from "./Menu";
import LoadingScreen from "./LoadingScreen";
import * as THREE from "three";

/** 
 * 3D Human Model Stand-in (simple mannequin, replace with GLTF later if needed)
 **/
function HumanPlayerModel({ position = [0, 1, 0] }) {
  // Stylized "mannequin" built from three.js primitives
  return (
    <group position={position}>
      {/* Torso */}
      <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 1.35, 0.35]} />
        <meshStandardMaterial color="#e2bc8a" metalness={0.25} roughness={0.6} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 2.15, 0]} castShadow>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshStandardMaterial color="#e3be98" roughness={0.7} />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.43, 1.43, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 0.65, 12]} />
        <meshStandardMaterial color="#d2a86c" />
      </mesh>
      <mesh position={[ 0.43, 1.43, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 0.65, 12]} />
        <meshStandardMaterial color="#d2a86c" />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.18, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.12, 0.85, 14]} />
        <meshStandardMaterial color="#8e7451" />
      </mesh>
      <mesh position={[0.18, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.12, 0.85, 14]} />
        <meshStandardMaterial color="#8e7451" />
      </mesh>
    </group>
  );
}

/** 
 * Target Board
 */
function TargetBoard({ position, boardId, onHit, visible }) {
  // Target board centered at `position`, simple circle with bullseye rings
  const meshRef = useRef();

  // Callback for collision detection (center shot)
  useEffect(() => {
    if (!meshRef.current) return;
    meshRef.current.boardId = boardId;
  }, [boardId]);

  if (!visible) return null;
  return (
    <group position={position}>
      {/* Board (large) */}
      <mesh ref={meshRef} castShadow receiveShadow name="TargetBoard">
        <cylinderGeometry args={[0.75, 0.75, 0.18, 32]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Concentric rings for bullseye */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 0.22, 32]} />
        <meshStandardMaterial color="#e53e3e" />
      </mesh>
      <mesh position={[0, 0.23, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.15, 32]} />
        <meshStandardMaterial color="#fff37e" />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.21, 0.21, 0.11, 32]} />
        <meshStandardMaterial color="#1a202c" />
      </mesh>
    </group>
  );
}

/** 
 * ProjectileMesh for player shooting
 */
function ProjectileMesh({ projectile }) {
  const meshRef = useRef();
  useEffect(() => {
    if (meshRef.current) meshRef.current.position.set(...projectile.position);
  }, [projectile]);
  if (!projectile.active) return null;
  return (
    <mesh ref={meshRef} position={projectile.position} castShadow>
      <sphereGeometry args={[0.07, 10, 10]} />
      <meshStandardMaterial color="#67edff" emissive="#73fff6" emissiveIntensity={0.75} />
    </mesh>
  );
}

/**
 * Shooting mechanics for sequential target boards
 */
function useTargetShooting({
  playerRef,
  targetBoards,
  currentTargetIndex,
  setScore,
  setShots,
  showHitScoreFeedback,
  nextTarget
}) {
  // Use a projectile array for shot feedback, but don't shoot at moving targets
  const [projectiles, setProjectiles] = useState([]);

  // Process click-to-shoot, create moving projectile and check for hit
  const shoot = useCallback((origin, aimDir) => {
    if (!aimDir) return false;
    setShots((shots) => shots + 1);

    // Simulate projectile path for instant hit detection (no need for real time travel)
    // We check if the ray (origin, aimDir) intersects the current visible target
    const target = targetBoards[currentTargetIndex];
    if (!target) return false;

    const boardPos = target.position;
    // Board's local up is +Y, faces the player from -Z axis
    // Board center = [x, y, z]
    // We'll treat the target area as a disc of radius 0.75 at (boardPos)
    // Compute intersection ("hit") using ray-plane, then check if point is inside disc

    const ray = new THREE.Ray(
      new THREE.Vector3(...origin),
      new THREE.Vector3(...aimDir).normalize()
    );

    // Board is vertical, normal faces the camera (player), lets fix plane as XY.
    const plane = new THREE.Plane(
      new THREE.Vector3(0, 0, 1), // facing +Z
      -boardPos[2] // plane at z = boardPos[2]
    );
    const intersect = new THREE.Vector3();
    if (!ray.intersectPlane(plane, intersect)) {
      // Shot is not aimed at plane
      showHitScoreFeedback("Miss!");
      return false;
    }

    // Check hit within board radius
    const hit2D = [intersect.x - boardPos[0], intersect.y - boardPos[1]];
    const distanceToCenter = Math.sqrt(hit2D[0] ** 2 + hit2D[1] ** 2);
    if (distanceToCenter < 0.21) {
      // Center/Bullseye (<=0.21)
      setScore((score) => score + 10);
      sound.playHit();
      showHitScoreFeedback("Bullseye! +10");
      setTimeout(nextTarget, 290);
      return true;
    } else if (distanceToCenter < 0.42) {
      // Mid ring (<=0.42)
      setScore((score) => score + 6);
      sound.playHit();
      showHitScoreFeedback("+6");
      setTimeout(nextTarget, 300);
      return true;
    } else if (distanceToCenter < 0.75) {
      // Outer ring (<=0.75)
      setScore((score) => score + 3);
      sound.playHit();
      showHitScoreFeedback("+3");
      setTimeout(nextTarget, 340);
      return true;
    } else {
      // Missed board
      showHitScoreFeedback("Miss!");
      return false;
    }
  }, [targetBoards, currentTargetIndex, setScore, setShots, showHitScoreFeedback, nextTarget]);

  // Animate/Feedback projectiles for brief visualization (like a ray)
  const visualShoot = useCallback((origin, aimDir) => {
    // Animate a quick "projectile" for feedback
    const id = Math.random().toString(36).slice(2);
    const speed = 21;
    const maxTime = 0.33;
    let t = 0;
    let alive = true;
    let animFrame = null;
    const projectile = {
      id,
      position: [...origin],
      active: true
    };
    setProjectiles((arr) => [...arr, projectile]);
    function animStep(ts) {
      if (!alive) return;
      t += 0.016;
      for (let i = 0; i < 3; i++) {
        projectile.position[i] += aimDir[i] * speed * 0.016;
      }
      if (t > maxTime) {
        projectile.active = false;
        setProjectiles((arr) => arr.filter((p) => p.id !== id));
        return;
      }
      animFrame = requestAnimationFrame(animStep);
    }
    animFrame = requestAnimationFrame(animStep);
    setTimeout(() => {
      alive = false;
      setProjectiles((arr) => arr.filter((p) => p.id !== id));
      if (animFrame) cancelAnimationFrame(animFrame);
    }, maxTime * 1000 + 60);
  }, []);

  return { shoot, projectiles, visualShoot };
}

/**
 * Generate new target board positions randomly (in a ring around the player)
 */
function generateTargetSequence(numTargets = 12, radius = 6) {
  const targets = [];
  let usedAngles = new Set();
  for (let i = 0; i < numTargets; ++i) {
    // Space out boards: avoid overlap, ensure variety
    let angle = Math.random() * Math.PI * 2;
    // Disallow too-close angles to previous targets
    let tries = 0;
    while (++tries < 20) {
      let tooClose = false;
      for (let a of usedAngles) {
        if (Math.abs(a - angle) < Math.PI / 7) { tooClose = true; break; }
      }
      if (!tooClose) break;
      angle = Math.random() * Math.PI * 2;
    }
    usedAngles.add(angle);
    let x = Math.cos(angle) * radius;
    let y = 1.14 + Math.random() * 0.22 - 0.11; // y = approx player torso
    let z = Math.sin(angle) * radius * (0.83 + Math.random() * 0.18);
    targets.push({
      id: i,
      position: [x, y, z]
    });
  }
  // shuffle for extra randomness
  for (let i = targets.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [targets[i], targets[j]] = [targets[j], targets[i]];
  }
  return targets;
}

/**
 * GameCanvas - New sequential target board shooting logic
 */
function GameCanvas() {
  // Player logic
  const playerRef = usePlayerControls();
  const [score, setScore] = useState(0);
  const [shots, setShots] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [gameState, setGameState] = useState("loading"); // loading|playing|paused|gameover
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [targetSequence, setTargetSequence] = useState([]);
  const [currentTargetIndex, setCurrentTargetIndex] = useState(0);
  const [timer, setTimer] = useState(60);
  const [hitScoreFeedback, setHitScoreFeedback] = useState("");
  const [showHitScore, setShowHitScore] = useState(false);

  // Reset everything for a new game
  const resetGame = useCallback(() => {
    setScore(0);
    setShots(0);
    setCurrentTargetIndex(0);
    setStatus("");
    setGameState("playing");
    setTimer(60);
    setAccuracy(0);
    const newTargets = generateTargetSequence(12 + Math.floor(Math.random() * 6));
    setTargetSequence(newTargets);

    if (playerRef && playerRef.player && playerRef.player.current) {
      playerRef.player.current.position = [0, 1, 0];
      playerRef.player.current.health = 100;
      if (playerRef.player.current.dir) {
        playerRef.player.current.dir.forward = 0;
        playerRef.player.current.dir.backward = 0;
        playerRef.player.current.dir.left = 0;
        playerRef.player.current.dir.right = 0;
      }
    }
  }, [playerRef]);

  // Loads assets (sounds, etc) with minimum "waiting" delay for user experience
  useEffect(() => {
    let cancelled = false;
    async function preloadAssets() {
      // Minimal: just wait and continue for now, sound loads fast
      await new Promise((r) => setTimeout(r, 320));
      if (!cancelled) {
        setLoading(false);
        resetGame();
      }
    }
    preloadAssets();
    return () => { cancelled = true; };
  }, [resetGame]);

  // Score and accuracy handling (recalculate when score/shots)
  useEffect(() => {
    setAccuracy(shots === 0 ? 0 : ((score / (shots * 10)) * 100));
  }, [score, shots]);

  // Timer logic (counts down only while playing)
  useEffect(() => {
    if (gameState !== "playing") return;
    if (timer <= 0) {
      setTimer(0);
      setTimeout(() => setGameState("gameover"), 300);
      return;
    }
    const interval = setInterval(() => {
      setTimer((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState, timer]);

  // Show hit/miss feedback anim
  const showHitScoreFeedback = (msg) => {
    setHitScoreFeedback(msg);
    setShowHitScore(true);
    setTimeout(() => setShowHitScore(false), 950);
  };

  // Advance to next target after hit (or end of sequence)
  const nextTarget = useCallback(() => {
    if (currentTargetIndex + 1 < targetSequence.length) {
      setCurrentTargetIndex((idx) => idx + 1);
    } else {
      setGameState("gameover");
    }
  }, [currentTargetIndex, targetSequence.length]);

  // Shooting mechanics hook
  const { shoot, projectiles, visualShoot } = useTargetShooting({
    playerRef,
    targetBoards: targetSequence,
    currentTargetIndex,
    setScore,
    setShots,
    showHitScoreFeedback,
    nextTarget
  });

  // Click handler for shooting
  useEffect(() => {
    function handleMouseDown(e) {
      if (gameState !== "playing") return;
      if (e.button !== 0) return;
      // Calculate aim: ray from player to the current target board, or forward if none.
      const player = playerRef.player.current;
      // For mouse-based aim, raycast from camera through mouse
      const aimOrigin = [player.position[0], 1.4, player.position[2]];
      let aimDir = [0, 0, -1];
      // If a target is visible, aim toward its center
      const target = targetSequence[currentTargetIndex];
      if (target) {
        const dx = target.position[0] - player.position[0];
        const dy = target.position[1] - 1.4;
        const dz = target.position[2] - player.position[2];
        const mag = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (mag > 0.001) {
          aimDir = [dx/mag, dy/mag, dz/mag];
        }
      }
      sound.playShoot();
      visualShoot(aimOrigin, aimDir);
      shoot(aimOrigin, aimDir);
    }
    window.addEventListener("mousedown", handleMouseDown);
    return () => window.removeEventListener("mousedown", handleMouseDown);
  }, [gameState, playerRef, targetSequence, currentTargetIndex, shoot, visualShoot]);

  // Keyboard shortcuts for pause/restart
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.repeat) return;
      if (gameState === "playing") {
        if (e.code === "Escape" || e.code === "KeyP") { setGameState("paused"); }
      } else if (gameState === "paused") {
        if (e.code === "Escape" || e.code === "KeyP") { setGameState("playing"); }
        if (e.code === "KeyR") { resetGame(); }
      } else if (gameState === "gameover") {
        if (e.code === "KeyR" || e.code === "Enter") { resetGame(); }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, resetGame]);

  // HUD Overlay: show hit/miss
  const HitScoreOverlay = () => (
    <div style={{
      position: "absolute",
      left: "50%", top: "40%",
      transform: "translate(-50%,-50%)",
      fontSize: "2.4rem",
      fontWeight: 900,
      color: hitScoreFeedback.includes("+") ? "#fee440" : "#e53e3e",
      textShadow: "0 2px 18px #000a, 0 2px 0 #fff4, 0 0 6px #fff7",
      opacity: showHitScore ? 1 : 0,
      pointerEvents: "none",
      transition: "opacity .24s,cubic-bezier(.7,.12,.18,.97)",
      zIndex: 99
    }}>{hitScoreFeedback}</div>
  );

  // Loading screen
  if (loading || gameState === "loading") {
    return <LoadingScreen message="Loading assets and game models..." />;
  }

  // Active game scene render
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#1a202c", position: "relative" }}>
      <Canvas
        shadows
        camera={{ fov: 65, position: [0, 4.7, 9], near: 0.1, far: 60 }}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.44} />
        <directionalLight
          position={[5, 12, 7]}
          intensity={1.15}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        {/* Ground plane */}
        <mesh
          receiveShadow
          rotation-x={-Math.PI / 2}
          position={[0, 0, 0]}
        >
          <planeGeometry args={[44, 44]} />
          <meshStandardMaterial color="#4a5568" />
        </mesh>
        {/* Player 3D human model visible */}
        <HumanPlayerModel position={playerRef.player.current.position} />
        {/* Sequential target board: only one shown at a time */}
        {targetSequence.length > 0 && targetSequence.map((board, idx) =>
          <TargetBoard
            key={board.id}
            position={board.position}
            boardId={board.id}
            visible={idx === currentTargetIndex}
          />
        )}
        {/* Projectile mesh visual only (no real projectile collision) */}
        {projectiles.map((proj) =>
          proj.active ? <ProjectileMesh key={proj.id} projectile={proj} /> : null
        )}
      </Canvas>
      {/* HUD: score, accuracy, timer */}
      {gameState === "playing" && (
        <HUD
          score={score}
          // Repurpose health bar as timer bar (seconds left)
          health={timer}
          status={
            <span>
              Accuracy: {accuracy.toFixed(1)}% 
              <span style={{ marginLeft: 12, color: "#e53e3e", fontWeight: 700 }}>
                {timer}s
              </span>
            </span>
          }
        />
      )}
      {/* Overlay: Hit/miss popups */}
      {showHitScore && <HitScoreOverlay />}
      {/* Paused & Gameover overlay - show stats and leaderboard */}
      <Menu
        open={gameState === "paused" || gameState === "gameover"}
        mode={gameState === "paused" ? "pause" : "gameover"}
        onResume={gameState === "paused" ? () => { setGameState("playing"); setStatus(""); } : undefined}
        onRestart={resetGame}
        score={score}
      />
    </div>
  );
}

export default GameCanvas;
