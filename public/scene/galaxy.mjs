/* 场景对象：Agent Core、主环与 6 个产品节点、装饰环、数据光丝、星尘 */
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Color, Group,
  IcosahedronGeometry, LineBasicMaterial, LineSegments, Mesh, Points, ShaderMaterial, Vector3,
} from "../vendor/three/three.min.js";
import { config } from "./config.mjs";
import { coreFragment, coreVertex, pointFragment, pointVertex } from "./shaders.mjs";

const TAU = Math.PI * 2;

function pointsMaterial(pixelRatio, { opacity = 1, twinkle = 0 } = {}) {
  return new ShaderMaterial({
    vertexShader: pointVertex,
    fragmentShader: pointFragment,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: pixelRatio },
      uOpacity: { value: opacity },
      uTwinkle: { value: twinkle },
    },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
}

function pointsGeometry(count) {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute("aColor", new BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute("aSize", new BufferAttribute(new Float32Array(count), 1));
  geometry.setAttribute("aPhase", new BufferAttribute(new Float32Array(count), 1));
  return geometry;
}

/* 圆环折线顶点：先在 XY 平面画圆，再依次绕 X、Z 轴旋转 */
function ringVertices(radius, rotX, rotZ, segments, out, offset) {
  const cx = Math.cos(rotX), sx = Math.sin(rotX), cz = Math.cos(rotZ), sz = Math.sin(rotZ);
  for (let i = 0; i < segments; i++) {
    for (let k = 0; k < 2; k++) {
      const a = ((i + k) / segments) * TAU;
      const x = radius * Math.cos(a);
      const y0 = radius * Math.sin(a);
      const y = y0 * cx;
      const z = y0 * sx;
      const o = offset + (i * 2 + k) * 3;
      out[o] = x * cz - y * sz;
      out[o + 1] = x * sz + y * cz;
      out[o + 2] = z;
    }
  }
}

export function createGalaxy({ quality, pixelRatio, accent, deep, nodeColors }) {
  const root = new Group();
  const disposables = [];
  const track = (...items) => { disposables.push(...items); return items[0]; };
  const accentColor = new Color(accent);
  const colors = nodeColors.map(value => new Color(value));
  const nodeCount = colors.length;

  /* Agent Core */
  const coreMaterial = track(new ShaderMaterial({
    vertexShader: coreVertex,
    fragmentShader: coreFragment,
    uniforms: {
      uTime: { value: 0 },
      uScale: { value: config.core.noiseScale },
      uAmp: { value: config.core.noiseAmp },
      uRim: { value: accentColor.clone() },
      uDeep: { value: new Color(deep) },
      uLight: { value: new Vector3(0.6, 1, 1.2) },
      uGlow: { value: 0 },
    },
  }));
  const coreGeometry = track(new IcosahedronGeometry(config.core.radius, config.core.detail[quality]));
  const core = new Mesh(coreGeometry, coreMaterial);
  root.add(core);

  /* 装饰环 + 主环，合并为一次绘制；颜色带 alpha */
  const segments = config.ring.segments;
  const rings = [[config.ring.radius, config.ring.tilt, config.ring.roll, 0.22], ...config.decorRings];
  const ringPositions = new Float32Array(rings.length * segments * 2 * 3);
  const ringColors = new Float32Array(rings.length * segments * 2 * 4);
  rings.forEach(([radius, rotX, rotZ, alpha], r) => {
    ringVertices(radius, rotX, rotZ, segments, ringPositions, r * segments * 6);
    for (let v = 0; v < segments * 2; v++) {
      ringColors.set([accentColor.r, accentColor.g, accentColor.b, alpha], (r * segments * 2 + v) * 4);
    }
  });
  const ringGeometry = track(new BufferGeometry());
  ringGeometry.setAttribute("position", new BufferAttribute(ringPositions, 3));
  ringGeometry.setAttribute("color", new BufferAttribute(ringColors, 4));
  const ringMaterial = track(new LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: AdditiveBlending }));
  root.add(new LineSegments(ringGeometry, ringMaterial));

  /* 主环平面：节点、光丝、光点都在该组的局部坐标中，位于 XY 平面 */
  const plane = new Group();
  // ZYX：先绕 X 倾斜、再绕 Z 滚转，与 ringVertices 的顺序一致
  plane.rotation.set(config.ring.tilt, 0, config.ring.roll, "ZYX");
  root.add(plane);

  // 每个节点 2 个点：外圈光晕 + 内核亮点
  const nodeGeometry = track(pointsGeometry(nodeCount * 2));
  const nodeMaterial = track(pointsMaterial(pixelRatio));
  nodeMaterial.depthTest = true;
  const nodes = new Points(nodeGeometry, nodeMaterial);
  plane.add(nodes);
  const nodeColorAttr = nodeGeometry.getAttribute("aColor");
  colors.forEach((color, i) => {
    nodeColorAttr.setXYZ(i * 2, color.r * 0.55, color.g * 0.55, color.b * 0.55);
    nodeColorAttr.setXYZ(i * 2 + 1, color.r, color.g, color.b);
  });

  // 光丝：从核心表面指向节点；端点颜色随悬停增亮
  const linkGeometry = track(new BufferGeometry());
  linkGeometry.setAttribute("position", new BufferAttribute(new Float32Array(nodeCount * 6), 3));
  linkGeometry.setAttribute("color", new BufferAttribute(new Float32Array(nodeCount * 8), 4));
  const linkMaterial = track(new LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: AdditiveBlending }));
  plane.add(new LineSegments(linkGeometry, linkMaterial));

  const flowCount = nodeCount * config.flow.perLink;
  const flowGeometry = track(pointsGeometry(flowCount));
  const flowMaterial = track(pointsMaterial(pixelRatio, { opacity: 0.9 }));
  const flow = new Points(flowGeometry, flowMaterial);
  plane.add(flow);
  const flowColorAttr = flowGeometry.getAttribute("aColor");
  const flowSizeAttr = flowGeometry.getAttribute("aSize");
  for (let i = 0; i < flowCount; i++) {
    const color = colors[Math.floor(i / config.flow.perLink)];
    flowColorAttr.setXYZ(i, color.r, color.g, color.b);
    flowSizeAttr.setX(i, 5);
  }

  /* 星尘：球壳内随机分布，缓慢自转并闪烁 */
  const dustCount = config.stardust[quality];
  const dustGeometry = track(pointsGeometry(dustCount));
  const dustMaterial = track(pointsMaterial(pixelRatio, { opacity: 0.75, twinkle: 0.6 }));
  const dustPosition = dustGeometry.getAttribute("position");
  const dustColor = dustGeometry.getAttribute("aColor");
  const dustSize = dustGeometry.getAttribute("aSize");
  const dustPhase = dustGeometry.getAttribute("aPhase");
  for (let i = 0; i < dustCount; i++) {
    const u = Math.random() * TAU;
    const v = Math.acos(2 * Math.random() - 1);
    const r = 3 + Math.random() * config.stardust.spread;
    dustPosition.setXYZ(i, r * Math.sin(v) * Math.cos(u), r * Math.sin(v) * Math.sin(u) * 0.6, r * Math.cos(v) - 2);
    const tint = Math.random() < 0.18 ? colors[i % nodeCount] : accentColor;
    const shade = 0.35 + Math.random() * 0.45;
    dustColor.setXYZ(i, tint.r * shade, tint.g * shade, tint.b * shade);
    dustSize.setX(i, 1.2 + Math.random() * 2.6);
    dustPhase.setX(i, Math.random() * TAU);
  }
  const dust = new Points(dustGeometry, dustMaterial);
  root.add(dust);

  const pointMaterials = [nodeMaterial, flowMaterial, dustMaterial];
  const nodeLocal = Array.from({ length: nodeCount }, () => [0, 0, 0]);
  let flowEnabled = quality === "high";
  flow.visible = flowEnabled;

  /* 每帧更新；state.hover 为 0..1 的逐节点悬停强度数组 */
  function update(time, state) {
    coreMaterial.uniforms.uTime.value = time * config.core.speed;
    coreMaterial.uniforms.uGlow.value = state.glow;
    coreMaterial.uniforms.uLight.value.set(state.pointerX * 2 + 0.4, state.pointerY * 2 + 1, 1.4);
    for (const material of pointMaterials) material.uniforms.uTime.value = time;
    dust.rotation.y = time * 0.012;

    const nodePosition = nodeGeometry.getAttribute("position");
    const nodeSize = nodeGeometry.getAttribute("aSize");
    const linkPosition = linkGeometry.getAttribute("position");
    const linkColor = linkGeometry.getAttribute("color");
    const flowPosition = flowGeometry.getAttribute("position");
    const radius = config.ring.radius;
    const coreRadius = config.core.radius * 1.08;

    for (let i = 0; i < nodeCount; i++) {
      const angle = state.ringAngle + (i / nodeCount) * TAU;
      const cos = Math.cos(angle), sin = Math.sin(angle);
      const x = radius * cos, y = radius * sin;
      const local = nodeLocal[i];
      local[0] = x; local[1] = y; local[2] = 0;
      const h = state.hover[i];
      nodePosition.setXYZ(i * 2, x, y, 0);
      nodePosition.setXYZ(i * 2 + 1, x, y, 0);
      nodeSize.setX(i * 2, (24 + 12 * h) * (1 + (config.hover.scale - 1) * h * 0.5));
      nodeSize.setX(i * 2 + 1, 7 * (1 + (config.hover.scale - 1) * h));

      linkPosition.setXYZ(i * 2, cos * coreRadius, sin * coreRadius, 0);
      linkPosition.setXYZ(i * 2 + 1, x, y, 0);
      const c = colors[i];
      const a = 0.12 + 0.55 * h;
      linkColor.setXYZW(i * 2, accentColor.r, accentColor.g, accentColor.b, a * 0.4);
      linkColor.setXYZW(i * 2 + 1, c.r, c.g, c.b, a + 0.1);

      if (flowEnabled) {
        for (let k = 0; k < config.flow.perLink; k++) {
          const t = (time * config.flow.speed + k / config.flow.perLink + i * 0.17) % 1;
          const d = coreRadius + (radius - coreRadius) * t;
          flowPosition.setXYZ(i * config.flow.perLink + k, cos * d, sin * d, 0);
        }
      }
    }
    nodePosition.needsUpdate = true;
    nodeSize.needsUpdate = true;
    linkPosition.needsUpdate = true;
    linkColor.needsUpdate = true;
    if (flowEnabled) flowPosition.needsUpdate = true;
  }

  return {
    root,
    plane,
    nodeLocal,
    update,
    setQuality(next) {
      flowEnabled = next === "high";
      flow.visible = flowEnabled;
      dustGeometry.setDrawRange(0, Math.min(dustCount, config.stardust[next]));
    },
    setPixelRatio(value) {
      for (const material of pointMaterials) material.uniforms.uPixelRatio.value = value;
    },
    dispose() {
      for (const item of disposables) item.dispose();
    },
  };
}
