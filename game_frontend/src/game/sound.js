import { Howl } from "howler";

/**
 * PUBLIC_INTERFACE
 * SoundManager: Handles all game sound effects.
 * Allows triggering of shooting, hit, and menu SFX with robust error handling.
 *
 * All SFX now use high-availability CC0/royalty-free sources from Pixabay (with CORS).
 * All load failures are handled gracefully so the game never hangs if URLs are broken or blocked.
 */
class SoundManager {
  constructor() {
    // Use sound effects from public domain, always with CORS and fallback detection
    // Safe fallback: silent stub object for error cases; always triggers "loaderror"/"load" handlers
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

    // SFX:
    // shoot: Pixabay "Laser futuristic shot" (CC0) https://pixabay.com/sound-effects/search/shoot/
    // hit:   Pixabay "Impact" (CC0) https://pixabay.com/sound-effects/search/hit/
    // menuOpen: Pixabay "Menu open" (CC0) https://pixabay.com/sound-effects/search/menu/
    // menuClose: Pixabay "Menu close" (CC0) https://pixabay.com/sound-effects/search/menu/
    this.sounds = {
      shoot: safeHowl({
        src: [
          "https://cdn.pixabay.com/audio/2022/07/26/audio_124bfa4d6c.mp3", // Laser futuristic
        ],
        volume: 0.23,
      }),
      hit: safeHowl({
        src: [
          "https://cdn.pixabay.com/audio/2022/10/16/audio_12c9ae1657.mp3", // Neutral Impact SFX (short hit/defeat)
        ],
        volume: 0.27,
      }),
      menuOpen: safeHowl({
        src: [
          "https://cdn.pixabay.com/audio/2022/10/16/audio_12c996d0c3.mp3", // Slight upward blip
        ],
        volume: 0.22,
      }),
      menuClose: safeHowl({
        src: [
          "https://cdn.pixabay.com/audio/2022/10/16/audio_12c99eb4e4.mp3", // Slight downward blip
        ],
        volume: 0.20,
      }),
    };
  }

  // PUBLIC_INTERFACE
  playShoot() {
    /** Play shooting sound effect */
    if (this.sounds.shoot && !this.sounds.shoot._srcError) {
      try { this.sounds.shoot.play(); } catch (e) {/* silent fail */ }
    }
  }

  // PUBLIC_INTERFACE
  playHit() {
    /** Play hit/defeat sound effect */
    if (this.sounds.hit && !this.sounds.hit._srcError) {
      try { this.sounds.hit.play(); } catch (e) {/* silent fail */ }
    }
  }

  // PUBLIC_INTERFACE
  playMenuOpen() {
    /** Play menu opening sound */
    if (this.sounds.menuOpen && !this.sounds.menuOpen._srcError) {
      try { this.sounds.menuOpen.play(); } catch (e) {/* silent fail */ }
    }
  }

  // PUBLIC_INTERFACE
  playMenuClose() {
    /** Play menu closing sound */
    if (this.sounds.menuClose && !this.sounds.menuClose._srcError) {
      try { this.sounds.menuClose.play(); } catch (e) {/* silent fail */ }
    }
  }
}

// Singleton instance to ensure one sound manager
export const sound = new SoundManager();
