/**
 * Web Audio API synthetic chime generator for clinical escalation alerts.
 * Generates clear, non-jarring synthesized sound alerts without external audio assets.
 */

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play synthesized chime based on escalation urgency tier.
 * @param {'TIER_1' | 'TIER_2' | 'RESOLVED'} tier
 */
export function playUrgentEscalationChime(tier = 'TIER_1') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (tier === 'TIER_2') {
      // High urgency: 2-tone sharp clinical beep (880Hz -> 1174Hz)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1174.66, now + 0.12);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.35, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.start(now);
      osc.stop(now + 0.3);

      // Repeat second pulse for Tier 2 urgency
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now + 0.35);
      osc2.frequency.setValueAtTime(1318.51, now + 0.47);
      gain2.gain.setValueAtTime(0.001, now + 0.35);
      gain2.gain.exponentialRampToValueAtTime(0.4, now + 0.38);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc2.start(now + 0.35);
      osc2.stop(now + 0.68);
    } else {
      // Tier 1: Soft dual harmony chime (587.33Hz D5 -> 880Hz A5)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.25, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.start(now);
      osc.stop(now + 0.48);
    }
  } catch (err) {
    console.warn('Audio playback not permitted or unsupported:', err);
  }
}
