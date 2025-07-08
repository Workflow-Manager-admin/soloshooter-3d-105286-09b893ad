import * as THREE from "three";

/**
 * PUBLIC_INTERFACE
 * Shooting mechanics and projectile management for player shots.
 * Includes projectiles state, spawning/shooting projectiles, updating, and collision detection with NPCs.
 */

// Projectile object structure
export class Projectile {
  /**
   * @param {Array<number>} position - [x, y, z] start position
   * @param {Array<number>} direction - normalized [x, y, z] direction vector
   * @param {number} speed - speed units/sec
   * @param {number} ttl - time-to-live in seconds
   */
  constructor(position, direction, speed = 18, ttl = 2.0) {
    this.position = [...position]; // [x, y, z]
    this.direction = [...direction];
    this.speed = speed;
    this.ttl = ttl;
    this.radius = 0.15; // for collision
    this.active = true;
    // For rendering
    this.meshRef = null;
    this.id = Math.floor(Math.random() * 1000000) + Date.now();
  }

  /**
   * Update the projectile's position based on its velocity.
   * @param {number} dt delta time
   */
  update(dt) {
    if (!this.active) return;
    for (let i = 0; i < 3; i++) {
      this.position[i] += this.direction[i] * this.speed * dt;
    }
    this.ttl -= dt;
    if (this.ttl <= 0) this.active = false;
    // Keep y at 1 (ground height)
    this.position[1] = 1;
    // Update mesh if available
    if (this.meshRef) {
      this.meshRef.position.set(...this.position);
    }
  }
}

/**
 * PUBLIC_INTERFACE
 * Controls projectile spawning and tracking.
 */
export class ShootingManager {
  constructor() {
    this.projectiles = [];
    this.lastShot = 0;
    this.fireRate = 0.18; // min seconds between shots
    this.score = 0;
  }

  /**
   * PUBLIC_INTERFACE
   * Attempt to shoot a projectile from player position toward a direction.
   * @param {Array<number>} playerPos [x, y, z]
   * @param {Array<number>} aimDir normalized [x, y, z] (flat, y=0)
   * @param {number} now current time (sec)
   * @returns {Projectile|null} the projectile if fired, else null
   */
  shoot(playerPos, aimDir, now) {
    if (now - this.lastShot < this.fireRate) return null;
    // Don't fire if direction is tiny
    if (!aimDir || Math.abs(aimDir[0]) + Math.abs(aimDir[2]) < 0.01) return null;
    const projectile = new Projectile(playerPos, aimDir);
    this.projectiles.push(projectile);
    this.lastShot = now;
    return projectile;
  }

  /**
   * PUBLIC_INTERFACE
   * Update all projectiles (move, check TTL, collision, etc).
   * @param {number} dt delta time in seconds
   * @param {Array<NPC>} npcs array of NPCs in the world
   * @returns {Array<number>} List of killed NPC ids
   */
  update(dt, npcs) {
    // Update projectiles
    for (const p of this.projectiles) {
      p.update(dt);
    }
    // Remove inactive
    this.projectiles = this.projectiles.filter((p) => p.active);

    // Check collisions
    const killedNPCIds = [];
    for (const p of this.projectiles) {
      if (!p.active) continue;
      for (const npc of npcs) {
        if (!npc || npc.dead) continue;
        // Basic sphere collision test
        const dx = p.position[0] - npc.position[0];
        const dz = p.position[2] - npc.position[2];
        const distSq = dx * dx + dz * dz;
        const minDist = p.radius + 0.7; // NPC radius ~0.7
        if (distSq < minDist * minDist) {
          // Hit!
          npc.dead = true;
          if (npc.meshRef) npc.meshRef.visible = false;
          p.active = false;
          killedNPCIds.push(npc.id);
          this.score += 1;
          break; // one projectile = one kill (no penetration)
        }
      }
    }
    return killedNPCIds;
  }
}

/**
 * PUBLIC_INTERFACE
 * Utility function to calculate flat (XZ) aim direction for player based on facing.
 * @param {Array<number>} playerPos [x, y, z]
 * @param {Array<number>} mouseDelta e.g., [dx, dy]
 * @param {Array<number>} playerDir vector or rotation[1] (optional)
 */
export function getPlayerAimDirection(playerState) {
  // For now, aim direction is player's movement direction (last input)
  // For a 3rd-person topdown style shooter, use the movement vector, or placeholder [look forward]
  const moveVec = {
    x: -playerState.dir.left + playerState.dir.right,
    z: -playerState.dir.forward + playerState.dir.backward,
  };
  let x = moveVec.x;
  let z = moveVec.z;
  // If not moving, default aim forward z-
  if (x === 0 && z === 0) z = -1;
  // Normalize
  const mag = Math.sqrt(x * x + z * z);
  return mag > 0 ? [x / mag, 0, z / mag] : [0, 0, -1];
}
