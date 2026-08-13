/** Pointer-driven CSS 3D tilt. Pause when the tab is hidden. */

import { reduced, pauseWhenHidden } from "./motion.js";

/**
 * @param {HTMLElement} el
 * @param {{ max?: number, invert?: boolean }} [opts]
 */
export function tiltTowardPointer(el, opts = {}) {
  if (!el || reduced()) return () => {};
  const max = opts.max ?? 10;
  const invert = opts.invert ? -1 : 1;
  let mx = 0;
  let my = 0;
  let paused = false;
  let raf = 0;

  const onMove = (e) => {
    const r = el.getBoundingClientRect();
    mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    my = ((e.clientY - r.top) / r.height - 0.5) * 2;
  };

  const tick = () => {
    if (!paused) {
      el.style.transform = `rotateX(${(-my * max * invert).toFixed(2)}deg) rotateY(${(mx * max * invert).toFixed(2)}deg)`;
    }
    raf = requestAnimationFrame(tick);
  };

  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerleave", () => {
    mx = 0;
    my = 0;
    el.style.transform = "";
  });
  raf = requestAnimationFrame(tick);
  const unpause = pauseWhenHidden((hidden) => {
    paused = hidden;
  });

  return () => {
    cancelAnimationFrame(raf);
    unpause();
    el.removeEventListener("pointermove", onMove);
  };
}
