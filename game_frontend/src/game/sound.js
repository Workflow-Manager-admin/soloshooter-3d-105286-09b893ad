import { Howl } from "howler";

/**
 * PUBLIC_INTERFACE
 * SoundManager: Handles all game sound effects.
 * Allows triggering of shooting, hit, and menu SFX with robust error handling.
 */
class SoundManager {
  constructor() {
    // Use sound effects from public domain or free sources with CORS headers
    // CC0 & reliable: https://freesound.org and ogg files on github or jsdelivr
    // Gracefully handle 404 or broken source (Howler emits 'loaderror' event)
    function safeHowl(options) {
      try {
        const howl = new Howl(options);
        howl._srcError = false;
        howl.once("loaderror", () => {
          howl._srcError = true;
        });
        return howl;
      } catch (err) {
        return {
          play: () => {},
          state: () => "error",
          _srcError: true,
          once: () => {},
        };
      }
    }

    this.sounds = {
      shoot: safeHowl({
        src: [
          "https://cdn.pixabay.com/audio/2022/07/26/audio_124bfa4d6c.mp3", // Pixabay CC0 Laser futuristic shot
          // fallback local/empty
        ],
        volume: 0.23,
      }),
      hit: safeHowl({
        src: [
          "https://cdn.pixabay.com/audio/2022/10/16/audio_12c9ae1657.mp3", // Pixabay CC0 Neutral hit impact
        ],
        volume: 0.27,
      }),
      menuOpen: safeHowl({
        src: [
          "https://cdn.pixabay.com/audio/2022/10/16/audio_12c996d0c3.mp3", // Pixabay CC0 Menu open blip
        ],
        volume: 0.22,
      }),
      menuClose: safeHowl({
        src: [
          "https://cdn.pixabay.com/audio/2022/10/16/audio_12c99eb4e4.mp3", // Pixabay CC0 Menu close blip
        ],
        volume: 0.20,
      }),
    };
  }

  // PUBLIC_INTERFACE
  playShoot() {
    /** Play shooting sound effect */
    if (this.sounds.shoot && !this.sounds.shoot._srcError) {
      try { this.sounds.shoot.play(); } catch (e) { /* fail silent */ }
    }
  }

  // PUBLIC_INTERFACE
  playHit() {
    /** Play hit/defeat sound effect */
    if (this.sounds.hit && !this.sounds.hit._srcError) {
      try { this.sounds.hit.play(); } catch (e) { /* fail silent */ }
    }
  }

  // PUBLIC_INTERFACE
  playMenuOpen() {
    /** Play menu opening sound */
    if (this.sounds.menuOpen && !this.sounds.menuOpen._srcError) {
      try { this.sounds.menuOpen.play(); } catch (e) { /* fail silent */ }
    }
  }

  // PUBLIC_INTERFACE
  playMenuClose() {
    /** Play menu closing sound */
    if (this.sounds.menuClose && !this.sounds.menuClose._srcError) {
      try { this.sounds.menuClose.play(); } catch (e) { /* fail silent */ }
    }
  }
}

// Singleton instance to ensure one sound manager
export const sound = new SoundManager();
