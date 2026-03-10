import { useEffect, useRef } from "react";

// ─── Seeded pseudo-random (deterministic per memory) ─────────────────────────
const seededRand = (seed) => {
    let s = seed;
    return () => {
        s = (s * 16807 + 0) % 2147483647;
        return (s - 1) / 2147483646;
    };
};

// ─── Simple Perlin-style smooth noise ────────────────────────────────────────
const smoothNoise = (x, y, rand) => {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);

    const h = (a, b) => {
        const r = seededRand((a * 1619 + b * 31337) ^ 0xdeadbeef);
        return r() * 2 - 1;
    };

    const n00 = h(ix, iy);
    const n10 = h(ix + 1, iy);
    const n01 = h(ix, iy + 1);
    const n11 = h(ix + 1, iy + 1);

    return (
        n00 * (1 - ux) * (1 - uy) +
        n10 * ux * (1 - uy) +
        n01 * (1 - ux) * uy +
        n11 * ux * uy
    );
};

// ─── Map OCEAN vector to visual parameters ───────────────────────────────────
const OCEAN_COLORS = {
    O: { h: 265, label: "Openness" },  // violet
    C: { h: 215, label: "Conscientiousness" },  // blue
    E: { h: 38, label: "Extraversion" },  // amber
    A: { h: 160, label: "Agreeableness" },  // green
    N: { h: 0, label: "Neuroticism" },  // red
};

const getDominantTrait = (ocean) => {
    if (!ocean) return { key: "O", score: 0.5 };
    const entries = Object.entries(ocean).filter(([, v]) => v !== null && v !== undefined);
    if (!entries.length) return { key: "O", score: 0.5 };
    const [key, score] = entries.sort((a, b) => b[1] - a[1])[0];
    return { key, score };
};

const oceanToSeed = (ocean) => {
    if (!ocean) return 12345;
    const vals = ["O", "C", "E", "A", "N"].map(k =>
        ocean[k] !== null && ocean[k] !== undefined ? Math.round(ocean[k] * 1000) : 500
    );
    // Combine into a single integer seed
    return vals.reduce((acc, v, i) => acc + v * Math.pow(31, i), 0) % 2147483647;
};

// ─── Draw the pattern on a canvas ────────────────────────────────────────────
const drawPattern = (canvas, ocean) => {
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const seed = oceanToSeed(ocean);
    const rand = seededRand(seed);
    const dom = getDominantTrait(ocean);
    const hue = OCEAN_COLORS[dom.key]?.h ?? 265;

    // OCEAN values (0-1), fallback 0.5
    const O = ocean?.O ?? 0.5;
    const C = ocean?.C ?? 0.5;
    const E = ocean?.E ?? 0.5;
    const A = ocean?.A ?? 0.5;
    const N = ocean?.N ?? 0.5;

    // Map traits to visual params
    const waveFreq = 1.5 + O * 3.5;      // Openness  → complexity/frequency
    const waveAmp = 0.3 + (1 - C) * 0.5; // Conscientiousness → chaos (inverse)
    const numLayers = Math.round(2 + E * 4); // Extraversion → more layers
    const saturation = Math.round(30 + A * 50); // Agreeableness → warmer/richer color
    const turbulence = N * 1.2;              // Neuroticism → noise turbulence

    // Dark background
    ctx.fillStyle = "#0a0a18";
    ctx.fillRect(0, 0, W, H);

    // Draw layered wave bands
    for (let layer = 0; layer < numLayers; layer++) {
        const layerOffset = rand() * 100;
        const alpha = 0.08 + rand() * 0.12;
        const lightness = 35 + layer * 8;

        ctx.beginPath();
        ctx.moveTo(0, H);

        for (let x = 0; x <= W; x += 2) {
            const nx = (x / W) * waveFreq + layerOffset;
            const base = (layer + 1) / (numLayers + 1);

            // Stack noise octaves for turbulence (Neuroticism)
            let ny =
                smoothNoise(nx, base, rand) * waveAmp +
                smoothNoise(nx * 2, base * 2, rand) * waveAmp * 0.5 * turbulence +
                smoothNoise(nx * 4, base * 4, rand) * waveAmp * 0.25 * turbulence;

            const y = H * (base + ny * 0.4);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }

        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.closePath();

        ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
        ctx.fill();
    }

    // Particle dots (density driven by Extraversion)
    const numDots = Math.round(20 + E * 60);
    for (let i = 0; i < numDots; i++) {
        const x = rand() * W;
        const y = rand() * H;
        const r = 0.5 + rand() * 2.5;
        const a = 0.1 + rand() * 0.35;
        const lDot = 55 + rand() * 30;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lDot}%, ${a})`;
        ctx.fill();
    }

    // Subtle vignette
    const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.85);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
};

// ─── Component ────────────────────────────────────────────────────────────────
const OceanPatternCanvas = ({ oceanVector, width = 800, height = 220, className = "" }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = width;
        canvas.height = height;
        drawPattern(canvas, oceanVector);
    }, [oceanVector, width, height]);

    const dom = getDominantTrait(oceanVector);
    const label = OCEAN_COLORS[dom.key]?.label ?? "Unknown";

    return (
        <div className={`relative rounded-xl overflow-hidden ${className}`} style={{ height }}>
            <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{ display: "block" }}
            />
            {/* Trait label overlay */}
            <div className="absolute bottom-2 right-3 flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">
                    {dom.key} · {label}
                </span>
            </div>
        </div>
    );
};

export default OceanPatternCanvas;