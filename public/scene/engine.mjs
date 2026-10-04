/* 首屏 3D 星系：把 .studio-map 的 6 个产品链接变成轨道节点标签；失败时恢复原 6 宫格 */
import { PerspectiveCamera, Scene, Vector3, WebGLRenderer } from "../vendor/three/three.min.js";
import { config } from "./config.mjs";
import { createGalaxy } from "./galaxy.mjs";
import { pickQuality } from "./quality.mjs";

const damp = (current, target, rate, dt) => current + (target - current) * (1 - Math.exp(-rate * dt));

export function mount(map, { requested } = {}) {
  const labels = Array.from(map.querySelectorAll(".map-project"));
  if (labels.length === 0 || map.offsetWidth === 0) return null;

  let quality = pickQuality(requested);
  const styles = getComputedStyle(document.documentElement);
  const accent = styles.getPropertyValue("--accent").trim() || "#67e8f9";
  const deep = styles.getPropertyValue("--bg").trim() || "#0b0e14";
  const nodeColors = labels.map(label => getComputedStyle(label).getPropertyValue("--product-accent").trim() || accent);

  let renderer;
  try {
    renderer = new WebGLRenderer({ antialias: quality === "high", alpha: true });
  } catch {
    return null;
  }
  const pixelRatio = () => Math.min(window.devicePixelRatio || 1, config.quality.dpr[quality]);
  renderer.setPixelRatio(pixelRatio());
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.className = "map-canvas";
  canvas.setAttribute("aria-hidden", "true");

  const scene = new Scene();
  const camera = new PerspectiveCamera(config.camera.fov, 1, 0.1, 60);
  const galaxy = createGalaxy({ quality, pixelRatio: pixelRatio(), accent, deep, nodeColors });
  scene.add(galaxy.root);

  /* 先锁定宽高比并隐藏宫格；布局切换在隐藏状态下完成，不计入布局偏移 */
  // 比例上限避免窄屏测得的竖长比例在横屏后让容器过高
  map.style.setProperty("--map-ratio", String(Math.min(map.offsetHeight / map.offsetWidth, 0.85)));
  map.classList.add("is-loading");

  const state = {
    ringAngle: 0, ringSpeed: config.ring.speed, glow: 0,
    pointerX: 0, pointerY: 0, targetX: 0, targetY: 0,
    hover: labels.map(() => 0), active: -1, scroll: 0, paused: false,
  };
  const size = { width: 1, height: 1, staticLabels: false, gridHeight: 0, barHeight: 0 };
  const labelSizes = labels.map(() => [0, 0]);
  const labelFront = labels.map(() => null);
  const scratch = new Vector3();

  function measureLabels() {
    labels.forEach((label, i) => { labelSizes[i] = [label.offsetWidth, label.offsetHeight]; });
    const grid = map.querySelector(".map-grid");
    const bar = map.querySelector(".map-bar");
    size.gridHeight = size.staticLabels && grid ? grid.offsetHeight : 0;
    size.barHeight = bar ? bar.offsetTop + bar.offsetHeight : 0;
  }

  function resize() {
    size.width = Math.max(1, map.clientWidth);
    size.height = Math.max(1, map.clientHeight);
    const staticLabels = size.width < config.staticLabelsBelow;
    if (staticLabels !== size.staticLabels) {
      size.staticLabels = staticLabels;
      map.classList.toggle("is-static-labels", staticLabels);
      if (staticLabels) {
        labels.forEach((label, i) => {
          label.style.transform = "";
          label.classList.remove("is-behind");
          labelFront[i] = null;
        });
      }
    }
    measureLabels();
    renderer.setSize(size.width, size.height, false);
    camera.aspect = size.width / size.height;
    // 让整个主环（含标签余量）落在可视区域内
    const halfTan = Math.tan((config.camera.fov * Math.PI) / 360);
    const available = staticLabels ? size.height - size.gridHeight : size.height;
    const reach = config.ring.radius + (staticLabels ? 0.4 : 0.8);
    const fitWidth = reach / (halfTan * camera.aspect);
    const fitHeight = (reach * 0.75) / (halfTan * (available / size.height));
    camera.position.z = Math.max(config.camera.z, fitWidth, fitHeight);
    camera.updateProjectionMatrix();
  }

  /* 静态标签模式下把星系上移到标签网格之上的区域中心 */
  function sceneOffsetY() {
    if (!size.staticLabels) return 0;
    const worldPerPx = (2 * camera.position.z * Math.tan((config.camera.fov * Math.PI) / 360)) / size.height;
    const freeCenter = size.barHeight + (size.height - size.gridHeight - size.barHeight) / 2;
    return (size.height / 2 - freeCenter) * worldPerPx;
  }

  /* 标签水平居中于节点，按节点在上半 / 下半区向外偏移，远离核心且彼此不重叠 */
  function placeLabels() {
    if (size.staticLabels) return;
    const centerY = size.height / 2;
    const top = size.barHeight + 8;
    const bottom = size.height - 40;
    galaxy.plane.updateMatrixWorld();
    for (let i = 0; i < labels.length; i++) {
      const local = galaxy.nodeLocal[i];
      galaxy.plane.localToWorld(scratch.set(local[0], local[1], local[2]));
      const front = scratch.z > -0.2;
      scratch.project(camera);
      const x = (scratch.x * 0.5 + 0.5) * size.width;
      const y = (-scratch.y * 0.5 + 0.5) * size.height;
      const [w, h] = labelSizes[i];
      const left = Math.min(Math.max(x - w / 2, 8), size.width - w - 8);
      const raw = y < centerY ? y - h - 12 : y + 12;
      const topPx = Math.min(Math.max(raw, top), bottom - h);
      labels[i].style.transform = `translate3d(${left.toFixed(1)}px, ${topPx.toFixed(1)}px, 0)`;
      if (labelFront[i] !== front) {
        labelFront[i] = front;
        labels[i].classList.toggle("is-behind", !front);
      }
    }
  }

  /* 交互：指针视差、标签悬停 / 聚焦联动节点 */
  const listeners = [];
  const on = (target, type, handler, options) => {
    target.addEventListener(type, handler, options);
    listeners.push(() => target.removeEventListener(type, handler, options));
  };
  on(map, "pointermove", event => {
    if (event.pointerType !== "mouse") return;
    const rect = map.getBoundingClientRect();
    state.targetX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    state.targetY = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
  }, { passive: true });
  on(map, "pointerleave", () => { state.targetX = 0; state.targetY = 0; });
  labels.forEach((label, i) => {
    const activate = () => { state.active = i; };
    const release = () => { if (state.active === i) state.active = -1; };
    on(label, "pointerenter", activate);
    on(label, "pointerleave", release);
    on(label, "focus", activate);
    on(label, "blur", release);
  });

  const hero = map.closest(".hero") || map;
  function readScroll() {
    const rect = hero.getBoundingClientRect();
    state.scroll = Math.min(Math.max(-rect.top / Math.max(rect.height, 1), 0), 1);
  }
  on(window, "scroll", readScroll, { passive: true });
  readScroll();

  /* 渲染循环：离开视口或标签页隐藏时停止 */
  let destroyed = false;
  let frame = 0;
  let readyFrame = 0;
  let last = 0;
  let elapsed = 0;
  let visible = true;
  let samples = 0;
  let sampleTime = 0;

  function render(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
    last = now;
    elapsed += dt;

    const hovering = state.active >= 0;
    state.ringSpeed = damp(state.ringSpeed, hovering || state.paused ? 0 : config.ring.speed, 4, dt);
    state.ringAngle += state.ringSpeed * dt;
    state.pointerX = damp(state.pointerX, state.targetX, 3, dt);
    state.pointerY = damp(state.pointerY, state.targetY, 3, dt);
    for (let i = 0; i < state.hover.length; i++) {
      state.hover[i] = damp(state.hover[i], i === state.active ? 1 : 0, config.hover.ease, dt);
    }
    state.glow = damp(state.glow, hovering ? 0.5 : 0, config.hover.ease, dt);

    const scale = 1 - config.scroll.shrink * state.scroll;
    galaxy.root.scale.setScalar(scale);
    galaxy.root.position.y = sceneOffsetY() + state.scroll * 0.8;
    camera.position.x = state.pointerX * config.camera.parallax;
    camera.position.y = state.pointerY * config.camera.parallax;
    camera.lookAt(0, 0, 0);

    galaxy.update(elapsed, state);
    renderer.render(scene, camera);
    placeLabels();

    // 运行时降档：持续偏慢时切到 low
    if (quality === "high" && elapsed > 1) {
      samples += 1;
      sampleTime += dt * 1000;
      if (samples >= config.quality.sampleFrames) {
        if (sampleTime / samples > config.quality.slowFrameMs) setQuality("low");
        samples = 0;
        sampleTime = 0;
      }
    }
  }

  function setQuality(next) {
    quality = next;
    renderer.setPixelRatio(pixelRatio());
    renderer.setSize(size.width, size.height, false);
    galaxy.setPixelRatio(pixelRatio());
    galaxy.setQuality(next);
  }

  function loop(now) {
    frame = 0;
    render(now);
    schedule();
  }
  function schedule() {
    if (!destroyed && !frame && visible && !document.hidden) frame = requestAnimationFrame(loop);
  }
  function pause() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
  }

  let observer = null;
  let resizeObserver = null;

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    pause();
    cancelAnimationFrame(readyFrame);
    pauseButton.remove();
    observer?.disconnect();
    resizeObserver?.disconnect();
    listeners.forEach(off => off());
    galaxy.dispose();
    renderer.dispose();
    canvas.remove();
    map.classList.remove("is-3d", "is-3d-pending", "is-loading", "is-ready", "is-static-labels");
    map.dataset.scene = "fallback";
    map.style.removeProperty("--map-ratio");
    labels.forEach(label => { label.style.transform = ""; label.classList.remove("is-behind"); });
  }

  /* 暂停 / 继续轨道运动（WCAG 2.2.2）；仅在 3D 模式存在 */
  const pauseButton = document.createElement("button");
  pauseButton.type = "button";
  pauseButton.className = "map-pause";
  pauseButton.setAttribute("aria-pressed", "false");
  pauseButton.textContent = "暂停动画";
  on(pauseButton, "click", () => {
    state.paused = !state.paused;
    pauseButton.setAttribute("aria-pressed", String(state.paused));
    pauseButton.textContent = state.paused ? "继续动画" : "暂停动画";
  });

  // 上下文丢失：恢复原 6 宫格
  on(canvas, "webglcontextlost", event => { event.preventDefault(); destroy(); });

  /* 隐藏帧绘制之后再切换到 3D 布局，下一帧再显示标签 */
  function activate() {
    if (destroyed) return;
    try {
      start();
    } catch (error) {
      destroy();
      throw error;
    }
  }
  function start() {
    map.prepend(canvas);
    const bar = map.querySelector(".map-bar");
    bar?.insertBefore(pauseButton, bar.lastElementChild);
    map.classList.add("is-3d");
    resize();
    render(performance.now());
    observer = new IntersectionObserver(entries => {
      if (destroyed) return;
      visible = entries[entries.length - 1].isIntersecting;
      if (visible) schedule(); else pause();
    });
    observer.observe(map);
    on(document, "visibilitychange", () => { if (document.hidden) pause(); else schedule(); });
    resizeObserver = new ResizeObserver(() => {
      if (destroyed) return;
      resize(); if (!frame) render(performance.now());
    });
    resizeObserver.observe(map);
    readyFrame = requestAnimationFrame(() => {
      map.classList.remove("is-loading");
      map.classList.add("is-ready");
      map.dataset.scene = "mounted";
    });
    schedule();
  }
  // 着色器并行编译完成后再切换，避免首帧长时间阻塞主线程
  renderer.compileAsync(scene, camera)
    .then(() => requestAnimationFrame(() => requestAnimationFrame(activate)))
    .catch(destroy);

  return { destroy };
}
