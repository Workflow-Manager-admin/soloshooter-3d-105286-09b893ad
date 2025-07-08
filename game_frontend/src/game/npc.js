/**
 * PUBLIC_INTERFACE
 * NPC logic module for 3D single-player shooter.
 * Provides NPC AI with basic patrol, chase, and attack states,
 * updating positions and responding to the player's position.
 */

import * as THREE from "three";

/** NPC STATES */
export const NPC_STATE = {
  PATROL: "patrol",
  CHASE: "chase",
  ATTACK: "attack",
};

/**
 * PUBLIC_INTERFACE
 * NPC class for basic AI enemy agent.
 */
export class NPC {
  /**
   * @param {Array<number>} position - Initial [x, y, z] position
   * @param {object} options - Optional AI parameters (speed, id, etc.)
   */
  constructor(position = [0, 1, 0], options = {}) {
    this.position = [...position]; // [x, y, z]
    this.state = NPC_STATE.PATROL;
    this.speed = options.speed || 2.0 + Math.random(); // units/sec
    this.patrolRadius = options.patrolRadius || 8 + Math.random() * 8;
    this.patrolOrigin = [...position];
    this.patrolAngle = Math.random() * Math.PI * 2;
    this.chaseDistance = options.chaseDistance || 10;
    this.attackDistance = options.attackDistance || 2;
    this.color = options.color || "#718096"; // secondary color
    this.health = options.health || 50;
    this.damage = options.damage || 5;
    this.id = options.id || Math.floor(Math.random() * 1000000);
    // For rendering
    this.meshRef = null; // Three.js mesh reference
  }

  /**
   * PUBLIC_INTERFACE
   * Update the NPC's behavior and position.
   * @param {number} dt - Delta time in seconds
   * @param {Array<number>} playerPos - Player [x, y, z] position
   */
  update(dt, playerPos) {
    const distToPlayer = this._distance3(this.position, playerPos);
    switch (this.state) {
      case NPC_STATE.PATROL:
        // If player is near, switch to chase
        if (distToPlayer < this.chaseDistance) {
          this.state = NPC_STATE.CHASE;
        }
        this._patrol(dt);
        break;

      case NPC_STATE.CHASE:
        // If close enough, attack. If player runs away, go back to patrol.
        if (distToPlayer < this.attackDistance) {
          this.state = NPC_STATE.ATTACK;
        } else if (distToPlayer > this.chaseDistance * 1.15) {
          this.state = NPC_STATE.PATROL;
        } else {
          this._moveToward(playerPos, dt);
        }
        break;

      case NPC_STATE.ATTACK:
        // If player leaves attack range, chase.
        if (distToPlayer >= this.attackDistance + 0.5) {
          this.state = NPC_STATE.CHASE;
        }
        // Attack logic stub: (trigger attack animation, apply damage, etc.)
        // Can be expanded later.
        break;
      default:
        break;
    }
    // y stays constant (for ground-based movement)
    this.position[1] = 1;
    // Optionally: update Three.js mesh position
    if (this.meshRef && this.meshRef.position) {
      this.meshRef.position.set(...this.position);
    }
  }

  /**
   * Private: Patrol in a circle around the patrol origin.
   */
  _patrol(dt) {
    // Walk in a simple circle for patrol
    this.patrolAngle += dt * 0.5 + Math.random() * 0.05; // Variance
    this.position[0] =
      this.patrolOrigin[0] + Math.cos(this.patrolAngle) * this.patrolRadius;
    this.position[2] =
      this.patrolOrigin[2] + Math.sin(this.patrolAngle) * this.patrolRadius;
  }

  /**
   * Private: Move toward a target position (for chase).
   */
  _moveToward(targetPos, dt) {
    const v = [
      targetPos[0] - this.position[0],
      0,
      targetPos[2] - this.position[2],
    ];
    const mag = Math.hypot(v[0], v[2]);
    if (mag > 0.01) {
      v[0] /= mag;
      v[2] /= mag;
      this.position[0] += v[0] * this.speed * dt;
      this.position[2] += v[2] * this.speed * dt;
    }
    // y unchanged
  }

  /**
   * Private: Distance between two [x, y, z] positions.
   */
  _distance3(a, b) {
    const dx = a[0] - b[0];
    const dz = a[2] - b[2];
    return Math.sqrt(dx * dx + dz * dz);
  }
}

/**
 * PUBLIC_INTERFACE
 * Generate a set of NPCs to enter the world.
 * @param {number} count - Number of NPCs to create
 * @param {Array<number>} areaCenter - [x, y, z] center position
 * @param {number} areaRadius - NPC spawn radius
 * @returns {NPC[]} Array of NPC objects
 */
export function createNPCs(count = 5, areaCenter = [0, 1, 0], areaRadius = 15) {
  const npcs = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random();
    const radius = areaRadius * (0.7 + Math.random() * 0.5);
    const px = areaCenter[0] + Math.cos(angle) * radius;
    const pz = areaCenter[2] + Math.sin(angle) * radius;
    npcs.push(
      new NPC([px, 1, pz], {
        patrolRadius: 5 + Math.random() * 7,
        speed: 1.7 + Math.random() * 0.8,
        id: i,
      })
    );
  }
  return npcs;
}
