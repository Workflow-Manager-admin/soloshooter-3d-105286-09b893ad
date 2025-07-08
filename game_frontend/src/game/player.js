/**
 * PUBLIC_INTERFACE
 * Player logic module for 3D single-player shooter.
 * Manages player state and provides functions for movement, aiming, and shooting.
 */

import { useRef, useEffect, useCallback } from "react";

/**
 * Defines the shape of the player state.
 */
export function createPlayerState() {
  return {
    position: [0, 1, 0], // [x, y, z]
    rotation: [0, 0, 0], // Euler rotation, radians
    velocity: [0, 0, 0], // [vx, vy, vz]
    speed: 5,            // movement units per second
    health: 100,
    isShooting: false,
    mouse: { x: 0, y: 0 }, // mouse coords for aiming
    dir: { forward: 0, backward: 0, left: 0, right: 0 },
    locked: false,         // for pointer-lock style mouse aim
  };
}

/**
 * PUBLIC_INTERFACE
 * Custom React hook for player control logic (keyboard/WASD/mouse + shooting).
 * Intended to be called inside the game scene component (e.g. GameCanvas).
 * 
 * Returns:
 *   {player, ref} - player state + playerRef to attach to mesh
 */
export function usePlayerControls() {
  const player = useRef(createPlayerState());

  // Keyboard event handlers (WASD/Arrows)
  const handleKeyDown = useCallback(e => {
    switch (e.code) {
      case "KeyW":
      case "ArrowUp":
        player.current.dir.forward = 1; break;
      case "KeyS":
      case "ArrowDown":
        player.current.dir.backward = 1; break;
      case "KeyA":
      case "ArrowLeft":
        player.current.dir.left = 1; break;
      case "KeyD":
      case "ArrowRight":
        player.current.dir.right = 1; break;
      case "Space":
        // reserved for jump in future
        break;
      case "ShiftLeft":
        // reserved for sprint
        break;
      default:
        break;
    }
  }, []);

  const handleKeyUp = useCallback(e => {
    switch (e.code) {
      case "KeyW":
      case "ArrowUp":
        player.current.dir.forward = 0; break;
      case "KeyS":
      case "ArrowDown":
        player.current.dir.backward = 0; break;
      case "KeyA":
      case "ArrowLeft":
        player.current.dir.left = 0; break;
      case "KeyD":
      case "ArrowRight":
        player.current.dir.right = 0; break;
      default:
        break;
    }
  }, []);

  // Mouse movement for aiming (pointer lock not yet implemented)
  const handleMouseMove = useCallback(e => {
    player.current.mouse.x = e.movementX;
    player.current.mouse.y = e.movementY;
    // Placeholder: implement actual camera/player yaw/pitch later
    // Here we just log aiming action
    //console.log("Mouse aim delta:", e.movementX, e.movementY);
  }, []);

  // Mouse LeftClick for shooting
  const handleMouseDown = useCallback(e => {
    if (e.button === 0) {
      player.current.isShooting = true;
      // Placeholder shoot mechanic
      // eslint-disable-next-line no-console
      console.log("[Shoot] Pew! Pew! at position", player.current.position, "rotation", player.current.rotation);
    }
  }, []);

  const handleMouseUp = useCallback(e => {
    if (e.button === 0) {
      player.current.isShooting = false;
    }
  }, []);

  // Attach/detach input listeners on mount/unmount
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleKeyDown, handleKeyUp, handleMouseMove, handleMouseDown, handleMouseUp]);

  // PUBLIC_INTERFACE
  // Call this on each animation frame to update position based on movement input.
  function updatePlayer(dt = 1 / 60) {
    // dt: delta time in seconds
    const move = { x: 0, z: 0 };
    // WASD + arrow
    move.z -= player.current.dir.forward;
    move.z += player.current.dir.backward;
    move.x -= player.current.dir.left;
    move.x += player.current.dir.right;

    // Normalize input
    let magnitude = Math.hypot(move.x, move.z);
    if (magnitude > 0) {
      move.x /= magnitude;
      move.z /= magnitude;

      // Move player (speed * dt)
      player.current.position[0] += move.x * player.current.speed * dt;
      player.current.position[2] += move.z * player.current.speed * dt;
    }

    // Placeholder for simple yaw (rotation[1]) using mouse (optional future)
    // Extended: adjust yaw/pitch by player.current.mouse.x/y or pointer lock

    // Reset mouse delta each frame (for next event)
    player.current.mouse.x = 0;
    player.current.mouse.y = 0;
  }

  return {
    player,
    updatePlayer,
  };
}
