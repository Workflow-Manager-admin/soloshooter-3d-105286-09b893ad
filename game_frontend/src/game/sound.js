import { Howl } from "howler";

/**
 * PUBLIC_INTERFACE
 * SoundManager: Handles all game sound effects.
 * Allows triggering of shooting, hit, and menu SFX. Can add more as needed.
 */
class SoundManager {
  constructor() {
    // Preload sound effects (use assets or CDN links in production)
    this.sounds = {
      shoot: new Howl({
        src: [
          "https://cdn.jsdelivr.net/gh/mat-sz/audio-sfx@master/shoot.wav"
        ],
        volume: 0.23,
      }),
      hit: new Howl({
        src: [
          "https://cdn.jsdelivr.net/gh/mat-sz/audio-sfx@master/hit.wav"
        ],
        volume: 0.27,
      }),
      menuOpen: new Howl({
        src: [
          "https://cdn.jsdelivr.net/gh/mat-sz/audio-sfx@master/menu-open.wav"
        ],
        volume: 0.22,
      }),
      menuClose: new Howl({
        src: [
          "https://cdn.jsdelivr.net/gh/mat-sz/audio-sfx@master/menu-close.wav"
        ],
        volume: 0.20,
      }),
    };
  }

  // PUBLIC_INTERFACE
  playShoot() {
    /** Play shooting sound effect */
    this.sounds.shoot && this.sounds.shoot.play();
  }

  // PUBLIC_INTERFACE
  playHit() {
    /** Play hit/defeat sound effect */
    this.sounds.hit && this.sounds.hit.play();
  }

  // PUBLIC_INTERFACE
  playMenuOpen() {
    /** Play menu opening sound */
    this.sounds.menuOpen && this.sounds.menuOpen.play();
  }

  // PUBLIC_INTERFACE
  playMenuClose() {
    /** Play menu closing sound */
    this.sounds.menuClose && this.sounds.menuClose.play();
  }
}

// Singleton instance to ensure one sound manager
export const sound = new SoundManager();
