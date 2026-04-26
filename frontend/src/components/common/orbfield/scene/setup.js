import * as THREE from "three";
import { getGlowTexture } from "../utils/textures";

// ─── Build the scene background sphere ───────────────────────────────────────
export const buildBackground = (scene) => {
    const bgGeo = new THREE.SphereGeometry(180, 32, 32);
    const bgCanvas = document.createElement("canvas");
    bgCanvas.width = 512;
    bgCanvas.height = 512;
    const bgCtx = bgCanvas.getContext("2d");
    const bgGrad = bgCtx.createLinearGradient(0, 0, 0, 512);
    bgGrad.addColorStop(0, "#0a0520");
    bgGrad.addColorStop(0.4, "#050214");
    bgGrad.addColorStop(0.7, "#0d0628");
    bgGrad.addColorStop(1, "#02020a");
    bgCtx.fillStyle = bgGrad;
    bgCtx.fillRect(0, 0, 512, 512);
    const bgTex = new THREE.CanvasTexture(bgCanvas);
    const bgMat = new THREE.MeshBasicMaterial({ map: bgTex, side: THREE.BackSide });
    scene.add(new THREE.Mesh(bgGeo, bgMat));
};

// ─── Build star field ────────────────────────────────────────────────────────
export const buildStars = (scene) => {
    const starGeo = new THREE.BufferGeometry();
    const starCount = 4000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
        const r = 60 + Math.random() * 100;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
        const tint = Math.random();
        if (tint < 0.6) { colors[i * 3] = 1; colors[i * 3 + 1] = 1; colors[i * 3 + 2] = 1; }
        else if (tint < 0.85) { colors[i * 3] = 0.55; colors[i * 3 + 1] = 0.7; colors[i * 3 + 2] = 1; }
        else { colors[i * 3] = 1; colors[i * 3 + 1] = 0.8; colors[i * 3 + 2] = 0.55; }
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
        size: 0.5, sizeAttenuation: true, vertexColors: true,
        transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    scene.add(stars);
    return stars;
};

// ─── Build floating dust particles ───────────────────────────────────────────
export const buildDust = (scene) => {
    const dustGeo = new THREE.BufferGeometry();
    const count = 400;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 50;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
        velocities[i * 3] = (Math.random() - 0.5) * 0.005;
        velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.005;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.005;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
        color: 0xa5b4fc, size: 0.15, sizeAttenuation: true, transparent: true,
        opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, map: getGlowTexture(),
    }));
    dust.userData.velocities = velocities;
    scene.add(dust);
    return dust;
};

// Update floating dust each frame
export const updateDust = (dust) => {
    if (!dust) return;
    const positions = dust.geometry.attributes.position.array;
    const velocities = dust.userData.velocities;
    for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i];
        positions[i + 1] += velocities[i + 1];
        positions[i + 2] += velocities[i + 2];
        if (positions[i] > 25) positions[i] = -25;
        if (positions[i] < -25) positions[i] = 25;
        if (positions[i + 1] > 25) positions[i + 1] = -25;
        if (positions[i + 1] < -25) positions[i + 1] = 25;
        if (positions[i + 2] > 25) positions[i + 2] = -25;
        if (positions[i + 2] < -25) positions[i + 2] = 25;
    }
    dust.geometry.attributes.position.needsUpdate = true;
};

// ─── Make a single nebula plane ──────────────────────────────────────────────
const makeNebula = (color, opacity, position, scale) => {
    const c = document.createElement("canvas");
    c.width = c.height = 512;
    const cx = c.getContext("2d");
    const r = (color >> 16) & 0xff, g = (color >> 8) & 0xff, b = color & 0xff;
    const grad = cx.createRadialGradient(256, 256, 0, 256, 256, 256);
    grad.addColorStop(0, `rgba(${r},${g},${b},${opacity})`);
    grad.addColorStop(0.4, `rgba(${r},${g},${b},${opacity * 0.4})`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    cx.fillStyle = grad;
    cx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const rad = 20 + Math.random() * 60;
        const wisp = cx.createRadialGradient(x, y, 0, x, y, rad);
        wisp.addColorStop(0, `rgba(${r},${g},${b},${opacity * 0.3})`);
        wisp.addColorStop(1, `rgba(${r},${g},${b},0)`);
        cx.fillStyle = wisp;
        cx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    const tex = new THREE.CanvasTexture(c);
    const mat = new THREE.MeshBasicMaterial({
        map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(scale, scale), mat);
    m.position.copy(position);
    return m;
};

// ─── Add all atmospheric nebulas ─────────────────────────────────────────────
export const buildNebulas = (scene) => {
    scene.add(makeNebula(0x4f46e5, 0.55, new THREE.Vector3(-15, 5, -45), 130));
    scene.add(makeNebula(0x7c3aed, 0.45, new THREE.Vector3(20, -10, -55), 150));
    scene.add(makeNebula(0xec4899, 0.3, new THREE.Vector3(-10, 15, -70), 110));
    scene.add(makeNebula(0x06b6d4, 0.25, new THREE.Vector3(15, -5, -35), 90));
    scene.add(makeNebula(0x8b5cf6, 0.2, new THREE.Vector3(0, 0, -90), 180));
};

// ─── Lighting ────────────────────────────────────────────────────────────────
export const buildLights = (scene) => {
    scene.add(new THREE.AmbientLight(0x6b7fff, 0.5));
    const key = new THREE.DirectionalLight(0xffffff, 0.6);
    key.position.set(8, 10, 12);
    scene.add(key);
    const rimP = new THREE.PointLight(0xa78bfa, 2.5, 80);
    rimP.position.set(-15, 8, -10);
    scene.add(rimP);
    const warmP = new THREE.PointLight(0xfbbf24, 1.5, 50);
    warmP.position.set(12, -6, 6);
    scene.add(warmP);
    scene.add(new THREE.PointLight(0x34d399, 1, 50, 1));
    scene.add(new THREE.PointLight(0xec4899, 0.8, 40, 1));
};

// ─── Init renderer + camera ──────────────────────────────────────────────────
export const buildRenderer = (mount) => {
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02020a, 0.012);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 400);
    camera.position.set(0, 0, 22);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x02020a, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    return { scene, camera, renderer };
};

// ─── Cleanup helper ──────────────────────────────────────────────────────────
export const disposeScene = (scene, renderer, mount) => {
    scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
            else obj.material.dispose();
        }
    });
    renderer.dispose();
    if (mount && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
    }
};