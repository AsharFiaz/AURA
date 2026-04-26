import * as THREE from "three";

export const updateOrbs = ({
    orbs,
    camera,
    cameraState,
    time,
    hoveredId,
    driftActive,
    revealActive,
}) => {
    orbs.forEach((o) => {
        if (o.isHidden) return;

        // Approach / explosion own this orb's transform/material
        if (o.isApproaching || o.isExploding) {
            o.rim.lookAt(camera.position);
            if (o.anchor) o.anchor.lookAt(camera.position);
            return;
        }

        const isHovered = o.memory._id === hoveredId;
        const isDraggedOrb = cameraState.isDraggingOrb && cameraState.draggedOrbId === o.memory._id;
        o.targetHoverScale = (isHovered || isDraggedOrb) ? 1.3 : 1;
        o.hoverScale += (o.targetHoverScale - o.hoverScale) * 0.12;

        if (driftActive && !isDraggedOrb && !revealActive) {
            o.velocity.z += (0.5 - o.recency) * 0.0006;
            o.group.position.x += o.velocity.x + Math.sin(time * 0.4 + o.phaseOffset) * 0.0018;
            o.group.position.y += o.velocity.y + Math.cos(time * 0.5 + o.phaseOffset) * 0.0018;
            o.group.position.z += o.velocity.z;

            const k = 0.0001;
            o.velocity.x += (o.basePosition.x - o.group.position.x) * k;
            o.velocity.y += (o.basePosition.y - o.group.position.y) * k;
            o.velocity.z += (o.basePosition.z - o.group.position.z) * k;
            o.velocity.multiplyScalar(0.985);
        } else if (isDraggedOrb) {
            o.group.position.add(o.velocity);
        }

        const bob = Math.sin(time * 0.6 + o.bobOffset) * 0.04;
        o.group.position.y += bob * 0.015;

        o.core.rotation.y += o.rotSpeed;
        o.core.rotation.x += o.rotSpeed * 0.3;

        o.rim.lookAt(camera.position);
        if (o.anchor) o.anchor.lookAt(camera.position);

        o.group.scale.setScalar(o.hoverScale);

        const pulse = 0.5 + Math.sin(time * 1.2 + o.phaseOffset) * 0.15;
        o.halo.material.opacity = (isHovered ? 0.85 : 0.4) * pulse;
        o.innerHalo.material.opacity = isHovered ? 1.0 : 0.7;

        const targetEmissive = isHovered ? 1.0 : 0.5;
        o.core.material.emissiveIntensity +=
            (targetEmissive - o.core.material.emissiveIntensity) * 0.12;

        // Shell shards opacity (each shard has own material)
        if (o.shards) {
            const shellAlpha = isHovered ? 0.32 : 0.18;
            o.shards.forEach((s) => {
                s.material.opacity += (shellAlpha - s.material.opacity) * 0.12;
            });
        }

        const labelTarget = isHovered ? 1.0 : 0.75;
        o.label.material.opacity += (labelTarget - o.label.material.opacity) * 0.08;

        if (o.likesBadge) {
            const badgeTarget = isHovered ? 1.0 : 0.7;
            o.likesBadge.material.opacity += (badgeTarget - o.likesBadge.material.opacity) * 0.08;
        }
    });
};

export const updateConstellations = (lines, time) => {
    lines.forEach((line) => {
        const { orbA, orbB } = line.userData;
        if (orbA.isHidden || orbB.isHidden ||
            orbA.isApproaching || orbB.isApproaching ||
            orbA.isExploding || orbB.isExploding) {
            line.material.opacity = 0;
            return;
        }
        const positions = line.geometry.attributes.position.array;
        positions[0] = orbA.group.position.x;
        positions[1] = orbA.group.position.y;
        positions[2] = orbA.group.position.z;
        positions[3] = orbB.group.position.x;
        positions[4] = orbB.group.position.y;
        positions[5] = orbB.group.position.z;
        line.geometry.attributes.position.needsUpdate = true;

        const dist = orbA.group.position.distanceTo(orbB.group.position);
        const proximity = Math.max(0, 1 - dist / 12);
        line.material.opacity = proximity * 0.18 * (0.7 + Math.sin(time * 0.8) * 0.3);
    });
};

export const resolveCollisions = (orbs) => {
    const live = orbs.filter((o) => !o.isHidden && !o.isApproaching && !o.isExploding);
    for (let i = 0; i < live.length; i++) {
        for (let j = i + 1; j < live.length; j++) {
            const a = live[i], b = live[j];
            const dx = a.group.position.x - b.group.position.x;
            const dy = a.group.position.y - b.group.position.y;
            const dz = a.group.position.z - b.group.position.z;
            const d2 = dx * dx + dy * dy + dz * dz;
            const minD = (a.baseSize + b.baseSize) * 1.2;
            if (d2 < minD * minD && d2 > 0.0001) {
                const d = Math.sqrt(d2);
                const push = (minD - d) * 0.012;
                const nx = dx / d, ny = dy / d, nz = dz / d;
                a.velocity.x += nx * push; a.velocity.y += ny * push; a.velocity.z += nz * push;
                b.velocity.x -= nx * push; b.velocity.y -= ny * push; b.velocity.z -= nz * push;
            }
        }
    }
};