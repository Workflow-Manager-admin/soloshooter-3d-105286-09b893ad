import React, { useRef, useState, useCallback, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { usePlayerControls } from "../game/player";
import { sound } from "../game/sound";
import HUD from "./HUD";
import Menu from "./Menu";
import LoadingScreen from "./LoadingScreen";
import * as THREE from "three";
// (FIX: No 'BatchedMesh' import. Remove ANY BatchedMesh usage below, as three.js does not export it.)

/**
 * PUBLIC_INTERFACE
 * PlayerGLTFModel renders a 3D player character model loaded from GLB/GLTF.
 * Uses a directly hotlinked asset from characters3d.com, posed for aim/shoot.
 * The model is scaled and positioned to match the intended player location.
 * 
 * If you want to switch to a local asset, download and reference in /assets.
 */
function PlayerGLTFModel({ position = [0, 1, 0] }) {
  // Using a "Male T-Pose" GLB from characters3d.com as a neutral start:
  // (Example: https://cdn.characters3d.com/asset/characters/human-male/tpose.glb)
  // For a "pose to shoot/aim" mesh, swap in a GLB with an aiming pose if found.
  // For demo: https://cdn.characters3d.com/asset/characters/human-male/tpose.glb
  // Example aiming: https://cdn.characters3d.com/asset/characters/human-male/aim.glb
  // We'll use aiming if available & fallback to tpose.
  const AIM_MODEL_URL = "https://cdn.characters3d.com/asset/characters/human-male/aim.glb";
  const { scene } = useGLTF(AIM_MODEL_URL);

  // Adjust the model's position and scale for the scene context.
  // Optionally, we can fine-tune orientation here.
  return (
    <primitive
      object={scene}
      position={position}
      scale={[0.94, 0.94, 0.94]} // fits to game scale
      rotation={[0, Math.PI, 0]} // face camera
      castShadow
      receiveShadow
    />
  );
}

/** 
 * Target Board (supports movement via movingX parameter)
 */
function TargetBoard({ position, boardId, onHit, visible, movingX = 0 }) {
  // Target board centered at `position`, simple circle with bullseye rings
  const meshRef = useRef();

  // Callback for collision detection (center shot)
  useEffect(() => {
    if (!meshRef.current) return;
    meshRef.current.boardId = boardId;
  }, [boardId]);

  if (!visible) return null;
  // Draw with animated local X offset if present
  const drawPosition = [
    position[0] + (movingX || 0),
    position[1],
    position[2]
  ];
  return (
    <group position={drawPosition}>
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

  // ===== Target Movement State ====
  // The offset along the local X axis to apply to the target board for visible movement.
  const [targetMoveOffset, setTargetMoveOffset] = useState(0);
  // 1 or -1, determines board's movement direction for bounce effect
  const [targetDirection, setTargetDirection] = useState(1);
  // Smooth speed, for gradual transitions
  const [displayedBoardSpeed, setDisplayedBoardSpeed] = useState(0.16);

  // Returns target board speed based on score (tuned for fun curve)
  // PUBLIC_INTERFACE
  function getTargetBoardSpeed(score) {
    // Base speed: very slow, increases every 5 points, upper cap
    // Adjust curve as needed for difficulty!
    const EASY = 0.16;    // at start (barely moves)
    const MAX = 0.70;     // max speed
    const curve = Math.min(MAX, EASY + 0.11 * Math.floor(score / 5) + (score / 180));
    return curve;
  }

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

    // Reset target movement for visual clarity and fairness
    setTargetMoveOffset(0);
    setTargetDirection(Math.random() > 0.5 ? 1 : -1);
    setDisplayedBoardSpeed(0.16);

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

  // Animate target board left-right movement (bounces within a range)
  useEffect(() => {
    if (gameState !== "playing") {
      // Reset for visual clarity between rounds/screens.
      setTargetMoveOffset(0);
      setDisplayedBoardSpeed(0.16);
      return;
    }

    // Range: how far (max) the target can travel from its original X (left/right)
    const MOVEMENT_RANGE = 1.32; // units (tune for fairness)
    // For smooth animation
    let lastFrameTs = performance.now();

    function animateTargetBoard(now) {
      // Only animate if we have a valid active board
      if (targetSequence.length === 0) {
        requestAnimationFrame(animateTargetBoard);
        return;
      }
      // Find which speed we aim for
      const targetSpeed = getTargetBoardSpeed(score);

      // Smoothly interpolate displayed speed for visual feel
      setDisplayedBoardSpeed(prev => prev * 0.85 + targetSpeed * 0.15);

      // Delta time calculation (seconds)
      const dt = Math.min((now - lastFrameTs) / 1000, 0.06);
      lastFrameTs = now;

      // Move the offset
      setTargetMoveOffset(prev => {
        let next = prev + displayedBoardSpeed * dt * targetDirection;
        // Bounce at range edges:
        if (next > MOVEMENT_RANGE) {
          next = MOVEMENT_RANGE;
          setTargetDirection(-1);
        } else if (next < -MOVEMENT_RANGE) {
          next = -MOVEMENT_RANGE;
          setTargetDirection(1);
        }
        return next;
      });

      // Continue animating if playing
      if (gameState === "playing" && timer > 0) {
        requestAnimationFrame(animateTargetBoard);
      }
    }
    // Animation frame entry
    let raf = requestAnimationFrame(animateTargetBoard);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
    // Only restart if new board, score, or game state change
    // eslint-disable-next-line
  }, [gameState, currentTargetIndex, targetSequence.length, score]);

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

  // Click handler for shooting - refactored to do raycast from camera through mouse
  useEffect(() => {
    /**
     * PUBLIC_INTERFACE
     * handleMouseDownWithRaycast
     * Handles mouse click for shooting:
     * - Only increments score/feedback if mouse ray directly hits the visible target board mesh.
     * - Plays shoot sound on all left clicks, but only gives score/hit feedback on a true hit.
     * - Does NOTHING (no sound, no feedback, no errors) for background or off-board clicks.
     */
    function handleMouseDown(e) {
      if (gameState !== "playing") return;
      if (e.button !== 0) return;

      // Get canvas dom and mouse pos relative to it
      const canvas = document.querySelector("canvas");
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();

      // Calculate normalized device coordinates (NDC) for mouse position
      const mouse = {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((e.clientY - rect.top) / rect.height) * 2 + 1,
      };

      // Use react-three-fiber's Three.js context to get current camera and scene
      const threeCtx = window._r3f ? window._r3f.root?.getState?.() : null;
      let camera, scene;
      if (threeCtx) {
        camera = threeCtx.camera;
        scene = threeCtx.scene;
      } else {
        // Silent fail: don't show technical errors, just do nothing
        return;
      }

      // Find the ONLY currently visible target board mesh (should be exactly 1)
      let targetBoardMesh = null;
      scene.traverse((obj) => {
        if (
          obj.type === "Mesh" &&
          obj.name === "TargetBoard" &&
          obj.visible // invisible boards shouldn't be hit
        ) {
          targetBoardMesh = obj;
        }
      });
      if (!targetBoardMesh) {
        // No visible board right now; clicks do nothing.
        return;
      }

      // Raycast from camera through mouse pointer to check intersection with board mesh
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      // Only test against current target board mesh (should return 0 or 1)
      const intersects = raycaster.intersectObject(targetBoardMesh, false);

      // Only do hit logic if raycast hit detected
      if (camera && camera.position && intersects && intersects.length > 0) {
        // Animate projectile visual always if on-target (for realism)
        visualShoot(
          [camera.position.x, camera.position.y, camera.position.z],
          raycaster.ray.direction.toArray()
        );

        // Play shoot sound ONLY if actually hit a board
        sound.playShoot();

        // Get world position of target board's center and where the ray hit
        const boardWorldPos = new THREE.Vector3();
        targetBoardMesh.getWorldPosition(boardWorldPos);

        const hit = intersects[0].point;
        const dx = hit.x - boardWorldPos.x;
        const dy = hit.y - boardWorldPos.y;
        const distanceToCenter = Math.sqrt(dx * dx + dy * dy);

        // Only increment score/feedback if truly inside hit area (outer ring or better)
        if (distanceToCenter < 0.75) {
          setShots((shots) => shots + 1);
          if (distanceToCenter < 0.21) {
            setScore((score) => score + 10);
            sound.playHit();
            showHitScoreFeedback("Bullseye! +10");
            setTimeout(() => nextTarget(), 290);
          } else if (distanceToCenter < 0.42) {
            setScore((score) => score + 6);
            sound.playHit();
            showHitScoreFeedback("+6");
            setTimeout(() => nextTarget(), 300);
          } else { // Outer ring
            setScore((score) => score + 3);
            sound.playHit();
            showHitScoreFeedback("+3");
            setTimeout(() => nextTarget(), 340);
          }
        }
        // IMPORTANT: If you hit mesh but not within outermost ring,
        // do NOTHING (no message, no miss feedback) and do not increment the shot count.
        // Silent no-response is UX correct here.
      } else {
        // Missed: Raycast hit nothing (background/ground/sky or off-target). NO FEEDBACK/ERROR/SFX.
        // *Do not* play sound, increment scores, or show miss message.
      }
    }

    window.addEventListener("mousedown", handleMouseDown);
    return () => window.removeEventListener("mousedown", handleMouseDown);
  }, [
    gameState,
    playerRef,
    targetSequence,
    currentTargetIndex,
    shoot,
    visualShoot,
    setScore,
    setShots,
    nextTarget
  ]);

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
        <PlayerGLTFModel position={playerRef.player.current.position} />
        {/* Sequential target board: only one shown at a time */}
        {targetSequence.length > 0 && targetSequence.map((board, idx) =>
          <TargetBoard
            key={board.id}
            position={board.position}
            boardId={board.id}
            visible={idx === currentTargetIndex}
            movingX={idx === currentTargetIndex ? targetMoveOffset : 0}
          />
        )}
        {/* Projectile mesh visual only (no real projectile collision) */}
        {projectiles.map((proj) =>
          proj.active ? <ProjectileMesh key={proj.id} projectile={proj} /> : null
        )}

        {/* --- Decorative Environmental Obstacles: Rocks and Trees --- */}
        {/* Place rocks and trees in a ring around play area, outside line of fire */}
        {(() => {
          // Parameters for arranging obstacles
          const boundaryRadius = 10; // just outside target boards
          const numRocks = 9;
          const numTrees = 8;
          const yGround = 0.15;

          // Helper: Place rocks at evenly spaced but offset positions
          const rocks = Array.from({length: numRocks}).map((_, i) => {
            const angle = (i / numRocks) * Math.PI * 2 + Math.sin(i) * 0.16;
            const x = Math.cos(angle) * (boundaryRadius + 1.6 + Math.sin(i * 1.3) * 1.1);
            const z = Math.sin(angle) * (boundaryRadius + 1.2 + Math.cos(i * 0.85) * 0.7);
            // Random rock scale
            const s = 0.74 + (Math.sin(i * 2.31) + 1) * 0.29 + Math.random() * 0.18;
            // Y "buried" a bit in ground, slight spread
            const y = yGround + Math.sin(angle * 2.3 + i) * 0.09 - 0.11 + Math.random() * 0.04;
            return (
              <mesh
                key={"rock" + i}
                position={[x, y, z]}
                castShadow
                receiveShadow
                rotation={[0, angle * 0.6 + i * 0.13, 0]}
              >
                <sphereGeometry args={[s * 0.62, 10, 8]} />
                <meshStandardMaterial color="#8a7b69" metalness={0.22} roughness={0.74} />
              </mesh>
            );
          });

          // Helper: Place trees at evenly spaced positions, offset azimuth from rocks for visual mix
          const trees = Array.from({length: numTrees}).map((_, i) => {
            const angle = (i / numTrees) * Math.PI * 2 + Math.PI/numTrees/2 + Math.cos(i * 0.91)*0.14;
            const x = Math.cos(angle) * (boundaryRadius + 2.3 + Math.cos(i * 2.08) * 0.45);
            const z = Math.sin(angle) * (boundaryRadius + 2.15 + Math.sin(i * 1.7) * 0.38);
            // Tree trunk
            const trunkHeight = 1.28 + Math.sin(i * 0.6) * 0.21 + Math.random() * 0.15;
            const trunkRadius = 0.19 + Math.sin(i * 1.2) * 0.04;
            // Tree foliage (cone or sphere for now)
            const foliageY = yGround + trunkHeight + 0.31;
            const trunkColor = "#71572c";
            const foliageColor = i % 2
              ? "#427c41"
              : "#3b6234";
            return (
              <group key={"tree" + i}>
                {/* Tree trunk */}
                <mesh position={[x, yGround + trunkHeight/2, z]} castShadow receiveShadow>
                  <cylinderGeometry args={[trunkRadius*0.92, trunkRadius, trunkHeight, 9]} />
                  <meshStandardMaterial color={trunkColor} metalness={0.13} roughness={0.47} />
                </mesh>
                {/* Foliage: a sphere or a "pine" cone */}
                <mesh position={[x, foliageY, z]} castShadow>
                  <sphereGeometry args={[trunkRadius * 2.1, 11, 8]} />
                  <meshStandardMaterial color={foliageColor} roughness={0.63} />
                </mesh>
                {i % 2 === 1 && (
                  <mesh position={[x, foliageY + trunkRadius*1.19, z]} castShadow>
                    <coneGeometry args={[trunkRadius * 1.4, trunkRadius*1.7, 8]} />
                    <meshStandardMaterial color={foliageColor} roughness={0.66} />
                  </mesh>
                )}
              </group>
            );
          });

          // Group all obstacles for clarity
          return <group>{rocks}{trees}</group>;
        })()}
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

/* Preload the aiming pose model for performance */
useGLTF.preload("https://cdn.characters3d.com/asset/characters/human-male/aim.glb");

export default GameCanvas;

