import * as THREE from "three";

// ─── Texture cache for image URLs ─────────────────────────────────────────────
const textureCache = new Map();

export const loadImageTexture = (url) => {
    if (!url) return null;
    if (textureCache.has(url)) return textureCache.get(url);
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";
    const tex = loader.load(url);
    tex.colorSpace = THREE.SRGBColorSpace;
    textureCache.set(url, tex);
    return tex;
};

// ─── Build text texture for caption-only memories ─────────────────────────────
export const buildTextTexture = (memory, traitColor) => {
    const w = 1024, h = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    const [r, g, b] = traitColor.rgb;
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grad.addColorStop(0, `rgba(${r},${g},${b},0.65)`);
    grad.addColorStop(0.6, `rgba(${Math.floor(r * 0.4)},${Math.floor(g * 0.4)},${Math.floor(b * 0.4)},0.9)`);
    grad.addColorStop(1, `rgba(8,8,20,0.98)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = `rgba(${r},${g},${b},0.3)`;
    ctx.font = "italic 600 280px Georgia, serif";
    ctx.textAlign = "left";
    ctx.fillText("\u201C", 80, 280);
    ctx.textAlign = "right";
    ctx.fillText("\u201D", w - 80, h - 80);

    ctx.fillStyle = "rgba(255,255,255,0.97)";
    ctx.font = "italic 500 72px Georgia, 'Times New Roman', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const words = (memory.caption || "").split(/\s+/);
    const lines = [];
    let line = "";
    const maxWidth = w * 0.75;
    for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth) {
            if (line) lines.push(line);
            line = word;
        } else {
            line = test;
        }
    }
    if (line) lines.push(line);

    const visible = lines.slice(0, 5);
    const lineHeight = 92;
    const cy = h / 2;
    const startY = cy - ((visible.length - 1) * lineHeight) / 2;

    ctx.shadowColor = `rgba(${r},${g},${b},1)`;
    ctx.shadowBlur = 50;
    visible.forEach((l, i) => ctx.fillText(l, w / 2, startY + i * lineHeight));
    ctx.shadowBlur = 0;

    if (lines.length > 5) {
        ctx.fillStyle = `rgba(${r},${g},${b},0.7)`;
        ctx.font = "300 56px Georgia, serif";
        ctx.fillText("\u2026", w / 2, startY + 5 * lineHeight + 30);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
};

// ─── Build username label texture ─────────────────────────────────────────────
export const buildLabelTexture = (text, traitColor) => {
    const w = 512, h = 128;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    const [r, g, b] = traitColor.rgb;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = `rgba(${r},${g},${b},0.95)`;
    ctx.font = "600 56px 'Inter', -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = `rgba(${r},${g},${b},1)`;
    ctx.shadowBlur = 24;
    ctx.fillText(text, w / 2, h / 2);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
};

// ─── Likes badge texture ─────────────────────────────────────────────────────
export const buildLikesBadgeTexture = (likesCount, traitColor) => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    const [r, g, b] = traitColor.rgb;
    ctx.fillStyle = `rgba(${r},${g},${b},0.95)`;
    ctx.font = "700 36px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = `rgba(${r},${g},${b},1)`;
    ctx.shadowBlur = 16;
    ctx.fillText(`\u2661 ${likesCount}`, 64, 32);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
};

// ─── Glow sprite texture (cached singleton) ──────────────────────────────────
let _glowTex = null;
export const getGlowTexture = () => {
    if (_glowTex) return _glowTex;
    const size = 256;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d");
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.15, "rgba(255,255,255,0.7)");
    grad.addColorStop(0.4, "rgba(255,255,255,0.2)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    _glowTex = new THREE.CanvasTexture(c);
    return _glowTex;
};

// ─── Fire/ember texture for explosions ───────────────────────────────────────
let _fireTex = null;
export const getFireTexture = () => {
    if (_fireTex) return _fireTex;
    const size = 128;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d");
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.2, "rgba(255,240,200,0.95)");
    grad.addColorStop(0.45, "rgba(255,160,40,0.7)");
    grad.addColorStop(0.7, "rgba(220,60,20,0.4)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    _fireTex = new THREE.CanvasTexture(c);
    return _fireTex;
};

// ─── Smoke texture ───────────────────────────────────────────────────────────
let _smokeTex = null;
export const getSmokeTexture = () => {
    if (_smokeTex) return _smokeTex;
    const size = 256;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d");
    // Wispy noise puff
    for (let i = 0; i < 40; i++) {
        const x = size / 2 + (Math.random() - 0.5) * size * 0.4;
        const y = size / 2 + (Math.random() - 0.5) * size * 0.4;
        const r = 20 + Math.random() * 40;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, "rgba(180,180,200,0.25)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    _smokeTex = new THREE.CanvasTexture(c);
    return _smokeTex;
};