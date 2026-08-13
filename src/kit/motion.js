/** Fun Toys motion helper — WAAPI + reduced-motion. One import per vanilla toy. */

export const reduced = () =>
  typeof matchMedia === "function" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

export const ease = {
  out: "cubic-bezier(0.16, 1, 0.3, 1)",
  inout: "cubic-bezier(0.65, 0, 0.35, 1)",
  press: "cubic-bezier(0.2, 0.8, 0.2, 1)",
};

/**
 * @param {Element} el
 * @param {Keyframe[] | PropertyIndexedKeyframes} keyframes
 * @param {number | KeyframeAnimationOptions} opts
 */
export function play(el, keyframes, opts = 400) {
  if (reduced() || !el?.animate) return null;
  const options =
    typeof opts === "number"
      ? { duration: opts, easing: ease.out, fill: "both" }
      : { easing: ease.out, fill: "both", ...opts };
  return el.animate(keyframes, options);
}

export function pauseWhenHidden(stop) {
  const on = () => {
    if (document.hidden) stop(true);
    else stop(false);
  };
  document.addEventListener("visibilitychange", on);
  return () => document.removeEventListener("visibilitychange", on);
}
