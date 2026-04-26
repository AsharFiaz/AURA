import * as THREE from "three";

// ─── Approach phase ──────────────────────────────────────────────────────────
// Lifts the clicked orb out of the field, scales it up dramatically, and
// flies it to a "center stage" position 7 units in front of the camera.
// Returns true once arrived → caller then triggers the explosion.

export const beginApproach = (orb, camera) => {
    const startPos = orb.group.position.clone();

    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    const targetPos = camera.position.clone().add(camDir.multiplyScalar(8));

    orb.isApproaching = true;
    orb.explodeTarget = 0; // make sure shards stay joined

    return {
        orb,
        startPos,
        targetPos,
        progress: 0,
        spinAngle: 0,
        startScale: orb.hoverScale ?? 1,
    };
};

export const updateApproach = (approach, camera, deltaT) => {
    if (!approach) return true;
    const { orb } = approach;

    // Cap deltaT to avoid huge jumps (first frame after click, tab refocus, etc)
    const stepT = Math.min(deltaT, 0.05);
    approach.progress = Math.min(approach.progress + stepT * 1.6, 1);

    const t = approach.progress;
    // Ease-in-out cubic
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // Track moving camera
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    approach.targetPos = camera.position.clone().add(camDir.multiplyScalar(8));

    // Travel
    orb.group.position.lerpVectors(approach.startPos, approach.targetPos, eased);

    // Scale 1× → 2.5×
    const scale = THREE.MathUtils.lerp(approach.startScale, 2.5, eased);
    orb.group.scale.setScalar(scale);
    orb.hoverScale = scale;

    // Spin faster
    approach.spinAngle += deltaT * (2 + eased * 8);
    orb.core.rotation.y = approach.spinAngle;
    orb.core.rotation.x = approach.spinAngle * 0.5;

    // Brighten
    orb.halo.material.opacity = THREE.MathUtils.lerp(0.4, 1.0, eased);
    orb.innerHalo.material.opacity = THREE.MathUtils.lerp(0.7, 1.0, eased);
    orb.core.material.emissiveIntensity = THREE.MathUtils.lerp(0.5, 2.0, eased);

    // Boost shell shard opacities (each shard has its own material clone)
    if (orb.shards) {
        const shellAlpha = THREE.MathUtils.lerp(0.18, 0.5, eased);
        orb.shards.forEach((s) => { s.material.opacity = shellAlpha; });
    }

    return approach.progress >= 1;
};

export const finishApproach = (approach) => {
    if (!approach) return;
    if (approach.orb) approach.orb.isApproaching = false;
};