// ─── OCEAN trait → color mapping ─────────────────────────────────────────────
export const OCEAN_COLORS = {
    O: { hex: 0xa78bfa, label: "Openness", rgb: [167, 139, 250], shape: "crystal" },
    C: { hex: 0x60a5fa, label: "Conscientiousness", rgb: [96, 165, 250], shape: "geode" },
    E: { hex: 0xfbbf24, label: "Extraversion", rgb: [251, 191, 36], shape: "sun" },
    A: { hex: 0x34d399, label: "Agreeableness", rgb: [52, 211, 153], shape: "bloom" },
    N: { hex: 0xf87171, label: "Neuroticism", rgb: [248, 113, 113], shape: "storm" },
};

export const FALLBACK = {
    hex: 0x818cf8,
    label: "Awaiting analysis",
    rgb: [129, 140, 248],
    shape: "crystal",
};

export const getDominantTrait = (oceanVector) => {
    if (!oceanVector) return { ...FALLBACK, key: null };
    const entries = Object.entries(oceanVector).filter(([, v]) => v !== null && v !== undefined);
    if (!entries.length) return { ...FALLBACK, key: null };
    const [key, score] = entries.sort((a, b) => b[1] - a[1])[0];
    return { ...(OCEAN_COLORS[key] ?? FALLBACK), key, score };
};

export const getOrbSize = (likesCount = 0) => {
    const base = 1.4;
    const boost = Math.log2(likesCount + 2) * 0.4;
    return Math.min(base + boost, 3.0);
};

export const getRecencyDepth = (createdAt, now) => {
    const ageHours = (now - new Date(createdAt).getTime()) / 3600000;
    return Math.min(Math.max(ageHours / 168, 0), 1);
};

// Convert OCEAN hex to CSS string
export const hexToCss = (hex) => `#${hex.toString(16).padStart(6, "0")}`;