/* Deadlift — 3D kettlebell: own geometry, three finishes, dither dissolve between them. */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

function hazardTexture() {
  const c = document.createElement("canvas");
  c.width = 2048; c.height = 1024;
  const g = c.getContext("2d");
  g.fillStyle = "#ffd400";
  g.fillRect(0, 0, c.width, c.height);
  g.save();
  g.fillStyle = "#0b0b0b";
  const step = 128;
  for (let x = -c.height; x < c.width + c.height; x += step * 2) {
    g.beginPath();
    g.moveTo(x, 0); g.lineTo(x + step, 0);
    g.lineTo(x + step - c.height, c.height); g.lineTo(x - c.height, c.height);
    g.closePath(); g.fill();
  }
  g.restore();
  // black band around the equator with the stamp
  g.fillStyle = "#0b0b0b";
  g.fillRect(0, 430, c.width, 170);
  g.fillStyle = "#ffd400";
  // the stamp must fit its half of the canvas with air at the seam ("KGDEADLIFT" otherwise)
  let size = 104;
  do {
    g.font = "500 " + size + "px 'Lexend Exa', 'Arial Black', sans-serif";
    size -= 2;
  } while (size > 40 && g.measureText("DEADLIFT 24 KG").width > 840);
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("DEADLIFT 24 KG", c.width * 0.25, 518);
  g.fillText("DEADLIFT 24 KG", c.width * 0.75, 518);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// Adds a screen-space dither threshold: fragments under uReveal survive.
function dissolvable(mat) {
  const u = { value: 1 };
  mat.userData.reveal = u;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uReveal = u;
    shader.fragmentShader = shader.fragmentShader
      .replace("void main() {", `uniform float uReveal;
float dlHash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
void main() {
  if (dlHash(floor(gl_FragCoord.xy / 3.0)) > uReveal) discard;`);
  };
  mat.transparent = mat.transparent || false;
  return mat;
}

function buildGeometry() {
  const group = [];
  const body = new THREE.SphereGeometry(1, 96, 64);
  body.scale(1, 0.94, 1);
  group.push({ geo: body, pos: [0, 0, 0] });
  const handle = new THREE.TorusGeometry(0.6, 0.13, 32, 96, Math.PI);
  group.push({ geo: handle, pos: [0, 1.0, 0] });
  const hornL = new THREE.CylinderGeometry(0.13, 0.15, 0.42, 32);
  group.push({ geo: hornL, pos: [-0.6, 0.8, 0] });
  const hornR = new THREE.CylinderGeometry(0.13, 0.15, 0.42, 32);
  group.push({ geo: hornR, pos: [0.6, 0.8, 0] });
  const base = new THREE.CylinderGeometry(0.56, 0.6, 0.1, 64);
  group.push({ geo: base, pos: [0, -0.9, 0] });
  return group;
}

export function mount(box, opts = {}) {
  const stage = box.querySelector(".idea__stage");
  const drag = box.querySelector(".idea__drag");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  } catch (e) {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.domElement.setAttribute("aria-hidden", "true");
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 2, 0.1, 50);
  camera.position.set(0, 0.35, 7.4);
  camera.lookAt(0, 0.1, 0);

  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(-3, 4, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffd400, 0.9);
  rim.position.set(3, 1, -3);
  scene.add(rim);

  const tex = hazardTexture();
  const mats = [
    dissolvable(new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.55, metalness: 0.05, clearcoat: 0.35, clearcoatRoughness: 0.4 })),
    dissolvable(new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true })),
    dissolvable(new THREE.MeshPhysicalMaterial({
      color: 0xffffff, metalness: 0, roughness: 0.04, transmission: 1, thickness: 1.2, ior: 1.5,
      iridescence: 1, iridescenceIOR: 1.35, iridescenceThicknessRange: [120, 520], envMapIntensity: 1.4
    }))
  ];
  // handle + horns + base never carry the stripe texture
  const plain = [
    dissolvable(new THREE.MeshPhysicalMaterial({ color: 0x111111, roughness: 0.45, metalness: 0.2, clearcoat: 0.3 })),
    mats[1],
    mats[2]
  ];

  const root = new THREE.Group();
  root.position.y = -0.05;
  scene.add(root);
  const layers = mats.map((m, i) => {
    const g = new THREE.Group();
    buildGeometry().forEach((part, k) => {
      const mesh = new THREE.Mesh(part.geo, k === 0 ? m : plain[i]);
      mesh.position.set(...part.pos);
      g.add(mesh);
    });
    g.visible = false;
    root.add(g);
    return g;
  });

  let current = opts.finish || 0;
  layers[current].visible = true;
  [mats[current], plain[current]].forEach((m) => (m.userData.reveal.value = 1));

  let fade = null;
  function setFinish(i) {
    if (i === current) return;
    dirty = true;
    const from = current, to = i;
    current = i;
    layers[to].visible = true;
    const fromMats = [mats[from], plain[from]], toMats = [mats[to], plain[to]];
    toMats.forEach((m) => (m.userData.reveal.value = 0));
    if (opts.reduced) {
      layers[from].visible = false;
      toMats.forEach((m) => (m.userData.reveal.value = 1));
      return;
    }
    fade = { t0: performance.now(), dur: 1300, fromMats, toMats, from };
    dirty = true;
  }

  // drag to orbit, slow auto-rotation (about 20 s per turn) unless paused
  let rotY = 0.5, rotX = 0.12, velY = 0, dragging = false, lastX = 0, lastY = 0;
  let paused = !!opts.paused || !!opts.reduced, dirty = true;
  drag.addEventListener("pointerdown", (ev) => {
    dragging = true; lastX = ev.clientX; lastY = ev.clientY;
    drag.setPointerCapture(ev.pointerId);
  });
  drag.addEventListener("pointermove", (ev) => {
    if (!dragging) return;
    const dx = ev.clientX - lastX, dy = ev.clientY - lastY;
    lastX = ev.clientX; lastY = ev.clientY;
    rotY += dx * 0.008; velY = dx * 0.008;
    rotX = Math.max(-0.5, Math.min(0.7, rotX + dy * 0.005));
    dirty = true;
  });
  const up = () => { dragging = false; };
  drag.addEventListener("pointerup", up);
  drag.addEventListener("pointercancel", up);

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const square = w / h < 1.2;
    camera.fov = square ? 42 : 30;
    camera.position.set(0, 0.35, square ? 9.2 : 10.5);
    camera.lookAt(0, 0.1, 0);
    camera.updateProjectionMatrix();
    dirty = true;
  }
  resize();
  new ResizeObserver(resize).observe(stage);

  let visible = true, raf = 0, prev = performance.now();
  function run() { cancelAnimationFrame(raf); prev = performance.now(); raf = requestAnimationFrame(frame); }
  new IntersectionObserver((en) => {
    visible = en[0].isIntersecting;
    if (visible) run(); else cancelAnimationFrame(raf);
  }).observe(box);

  function frame() {
    const now = performance.now();
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    if (!dragging) {
      velY *= 0.92;
      if (Math.abs(velY) < 1e-5) velY = 0;
      rotY += velY + (paused ? 0 : dt * (Math.PI * 2 / 20));
    }
    // nothing moves: skip the draw (paused, or reduced motion at rest)
    const idle = paused && !dragging && !fade && velY === 0 && !dirty;
    if (!idle) {
      root.rotation.set(rotX, rotY, 0);
      if (fade) {
        const p = Math.max(0, Math.min(1, (now - fade.t0) / fade.dur));
        fade.toMats.forEach((m) => (m.userData.reveal.value = p));
        fade.fromMats.forEach((m) => (m.userData.reveal.value = 1 - p));
        if (p >= 1) { layers[fade.from].visible = false; fade = null; }
      }
      renderer.render(scene, camera);
      dirty = false;
    }
    if (visible) raf = requestAnimationFrame(frame);
  }
  run();

  return { setFinish, setPaused(v) { paused = !!v; dirty = true; } };
}
