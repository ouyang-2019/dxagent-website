/* 首屏 3D 星系的全部可调参数；颜色在运行时从 CSS 变量读取，与页面 token 保持同源 */
export const config = {
  camera: { fov: 32, z: 10.5, parallax: 0.35 },
  core: { radius: 1.05, detail: { high: 20, low: 10 }, noiseScale: 1.6, noiseAmp: 0.08, speed: 0.22 },
  ring: { radius: 3.2, tilt: 1.08, roll: -0.12, speed: 0.07, nodeRadius: 0.085, segments: 160 },
  // 装饰环：只有线，没有节点；[半径, 绕 X 倾角, 绕 Z 倾角, 透明度]
  decorRings: [[2.35, 1.32, 0.42, 0.12], [3.7, 1.05, -0.5, 0.08], [4.3, 1.4, 0.2, 0.05]],
  flow: { perLink: 3, speed: 0.35 },
  stardust: { high: 900, low: 280, spread: 9 },
  hover: { scale: 2.2, ease: 6 },
  scroll: { shrink: 0.35 },
  quality: {
    dpr: { high: 2, low: 1.25 },
    // 平均帧时超过该阈值（毫秒）持续 sampleFrames 帧后降到 low
    slowFrameMs: 22,
    sampleFrames: 120,
  },
  // 容器宽度低于该值时，标签以静态网格排列在星系下方
  staticLabelsBelow: 560,
};
