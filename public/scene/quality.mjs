/* 画质档位；off 档与 WebGL2 探测由 home.js 在加载 3D 模块前判断 */
export function pickQuality(requested) {
  if (requested === "low" || requested === "high") return requested;
  const narrow = window.innerWidth < 768;
  const fewCores = (navigator.hardwareConcurrency || 8) <= 4;
  return narrow || fewCores ? "low" : "high";
}
