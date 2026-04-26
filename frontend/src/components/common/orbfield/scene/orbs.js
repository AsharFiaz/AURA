import * as THREE from "three";
import {
    loadImageTexture,
    buildTextTexture,
    buildLabelTexture,
    buildLikesBadgeTexture,
    getGlowTexture,
} from "../utils/textures";
import { buildOrbGeometry, buildShardGeometries, getShardSourceFor } from "../utils/geometry";
import { getDominantTrait, getOrbSize, getRecencyDepth } from "../utils/ocean";

// ─── Build content texture based on memory type ──────────────────────────────
const buildContentTexture = (memory, trait) => {
    let videoElement = null;
    let texture = null;

    if (memory.image) {
        texture = loadImageTexture(memory.image);
    } else if (memory.video) {
        videoElement = document.createElement("video");
        videoElement.crossOrigin = "anonymous";
        videoElement.loop = true;
        videoElement.muted = true;
        videoElement.playsInline = true;
        videoElement.src = memory.video;
        videoElement.play().catch(() => { });
        texture = new THREE.VideoTexture(videoElement);
        texture.colorSpace = THREE.SRGBColorSpace;
    } else {
        texture = buildTextTexture(memory, trait);
    }
    return { texture, videoElement };
};

// ─── Build pre-fractured shell ───────────────────────────────────────────────
// THIS is the wass08 pattern: instead of one solid shell, we build ~24 shard
// meshes that together form the shell. Each shard remembers its origin
// position so on click we can lerp it outward (explode) or back (reform).
const buildShatteredShell = (radius, traitShape, traitHex) => {
    const shardSource = getShardSourceFor(traitShape);
    const shardData = buildShardGeometries(radius, 28, shardSource);

    const sharedMaterial = new THREE.MeshPhysicalMaterial({
        color: traitHex,
        emissive: traitHex,
        emissiveIntensity: 0.15,
        roughness: 0.0,
        metalness: 0.0,
        transparent: true,
        opacity: 0.18,
        transmission: 0.5,
        thickness: 0.8,
        ior: 1.4,
        clearcoat: 1.0,
        side: THREE.DoubleSide,
        depthWrite: false,
    });

    const group = new THREE.Group();
    const shards = [];

    shardData.forEach((s) => {
        const shardMesh = new THREE.Mesh(s.geometry, sharedMaterial.clone());
        // Each shard sits at its centroid offset (so it visually forms the shell)
        // We move the geometry's verts, but keep position at 0 — its centroid IS the position
        shardMesh.userData.origin = new THREE.Vector3(0, 0, 0);
        shardMesh.userData.outwardDir = s.centroid.clone().normalize();
        shardMesh.userData.spinAxis = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
        ).normalize();
        shardMesh.userData.spinSpeed = 0.5 + Math.random() * 1.5;
        group.add(shardMesh);
        shards.push(shardMesh);
    });

    return { shellGroup: group, shards, sharedMaterial };
};

// ─── Build a single orb ──────────────────────────────────────────────────────
export const buildOrb = (memory, index, total, scene) => {
    const trait = getDominantTrait(memory.oceanVector);
    const baseSize = getOrbSize(memory.likesCount);
    const recency = getRecencyDepth(memory.createdAt, Date.now());
    const glowTex = getGlowTexture();

    const phi = Math.acos(1 - 2 * (index + 0.5) / total);
    const theta = Math.PI * (1 + Math.sqrt(5)) * index;
    const clusterR = 9 + Math.random() * 4;
    const x = clusterR * Math.cos(theta) * Math.sin(phi);
    const y = clusterR * Math.sin(theta) * Math.sin(phi);
    const z = clusterR * Math.cos(phi) * 0.7 - recency * 5;

    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.userData.memoryId = memory._id;

    // Outer halo
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex, color: trait.hex, transparent: true, opacity: 0.4,
        blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    halo.scale.setScalar(baseSize * 5);
    group.add(halo);

    // Inner halo
    const innerHalo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex, color: trait.hex, transparent: true, opacity: 0.7,
        blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    innerHalo.scale.setScalar(baseSize * 2.8);
    group.add(innerHalo);

    // Content texture
    const { texture: contentTexture, videoElement } = buildContentTexture(memory, trait);

    // Core (always intact — the inner sphere with memory content on it)
    const coreGeo = buildOrbGeometry(baseSize * 0.72, trait.shape);
    const coreMat = new THREE.MeshStandardMaterial({
        map: contentTexture,
        emissive: trait.hex,
        emissiveIntensity: 0.5,
        emissiveMap: contentTexture,
        roughness: trait.shape === "sun" ? 0.15 : 0.3,
        metalness: trait.shape === "geode" ? 0.4 : 0.1,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // ─── PRE-FRACTURED SHELL (wass08 style) ─────────────────────────────────
    // Built once at orb creation. Each shard knows where it lives in the shell
    // and which direction is "outward". On click, we just animate them outward.
    const { shellGroup, shards } = buildShatteredShell(baseSize, trait.shape, trait.hex);
    group.add(shellGroup);

    // Hit-test proxy — invisible sphere covers all the shards so raycasting
    // works whether shards are joined or exploded.
    const hitProxy = new THREE.Mesh(
        new THREE.SphereGeometry(baseSize, 32, 32),
        new THREE.MeshBasicMaterial({ visible: false, transparent: true, opacity: 0 })
    );
    hitProxy.userData.memoryId = memory._id;
    hitProxy.userData.isShell = true;
    group.add(hitProxy);

    // Highlight bubble
    const highlight = new THREE.Mesh(
        new THREE.SphereGeometry(baseSize * 0.3, 16, 16),
        new THREE.MeshBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 0.4,
            blending: THREE.AdditiveBlending, depthWrite: false,
        })
    );
    highlight.position.set(-baseSize * 0.4, baseSize * 0.4, baseSize * 0.4);
    highlight.scale.set(1, 1, 0.3);
    group.add(highlight);

    // Rim ring
    const rim = new THREE.Mesh(
        new THREE.RingGeometry(baseSize * 1.0, baseSize * 1.03, 64),
        new THREE.MeshBasicMaterial({
            color: trait.hex, transparent: true, opacity: 0.5,
            side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
        })
    );
    group.add(rim);

    // Username label
    const labelTex = buildLabelTexture(`@${memory.user?.username || "unknown"}`, trait);
    const label = new THREE.Sprite(new THREE.SpriteMaterial({
        map: labelTex, transparent: true, opacity: 0.0, depthWrite: false,
    }));
    label.scale.set(baseSize * 2.5, baseSize * 0.625, 1);
    label.position.set(0, baseSize * 2.5, 0);
    group.add(label);

    // Likes badge
    let likesBadge = null;
    if ((memory.likesCount || 0) > 0) {
        const badgeTex = buildLikesBadgeTexture(memory.likesCount, trait);
        likesBadge = new THREE.Sprite(new THREE.SpriteMaterial({
            map: badgeTex, transparent: true, opacity: 0.0, depthWrite: false,
        }));
        likesBadge.scale.set(baseSize * 1.0, baseSize * 0.5, 1);
        likesBadge.position.set(baseSize * 1.2, -baseSize * 0.6, 0);
        group.add(likesBadge);
    }

    // Avatar anchor
    let anchor = null;
    if (memory.user?.profilePicture) {
        const anchorTex = loadImageTexture(memory.user.profilePicture);
        anchor = new THREE.Mesh(
            new THREE.CircleGeometry(baseSize * 0.18, 32),
            new THREE.MeshBasicMaterial({ map: anchorTex, transparent: true, side: THREE.DoubleSide })
        );
        anchor.position.set(0, -baseSize * 1.4, 0);
        group.add(anchor);
    }

    scene.add(group);

    return {
        group,
        shellGroup,         // ← container for shards
        shards,             // ← the shard meshes (the wass08 magic)
        hitProxy,           // ← invisible raycast target
        shell: hitProxy,    // ← alias so old code keeps working
        core,
        rim,
        halo,
        innerHalo,
        anchor,
        label,
        likesBadge,
        videoElement,
        memory,
        baseSize,
        contentTexture,
        basePosition: new THREE.Vector3(x, y, z),
        velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.003,
            (Math.random() - 0.5) * 0.003,
            (Math.random() - 0.5) * 0.0015
        ),
        hoverScale: 1,
        targetHoverScale: 1,
        recency,
        trait,
        phaseOffset: Math.random() * Math.PI * 2,
        rotSpeed: 0.0015 + Math.random() * 0.001,
        bobOffset: Math.random() * Math.PI * 2,
        isHidden: false,
        explodeAmount: 0,   // ← 0 = joined, 1 = fully exploded
    };
};

// Constellation lines unchanged
export const buildConstellationLines = (orbs, scene) => {
    const lines = [];
    for (let i = 0; i < orbs.length; i++) {
        for (let j = i + 1; j < orbs.length; j++) {
            const a = orbs[i], b = orbs[j];
            if (a.trait.key !== b.trait.key || !a.trait.key) continue;
            const dist = a.basePosition.distanceTo(b.basePosition);
            if (dist > 9) continue;
            const lineGeo = new THREE.BufferGeometry().setFromPoints([
                a.basePosition.clone(), b.basePosition.clone(),
            ]);
            const lineMat = new THREE.LineBasicMaterial({
                color: a.trait.hex,
                transparent: true, opacity: 0.15,
                blending: THREE.AdditiveBlending, depthWrite: false,
            });
            const line = new THREE.Line(lineGeo, lineMat);
            line.userData = { orbA: a, orbB: b };
            scene.add(line);
            lines.push(line);
        }
    }
    return lines;
};

export const disposeOrbs = (orbs, scene) => {
    orbs.forEach((o) => {
        scene.remove(o.group);
        o.group.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                else child.material.dispose();
            }
        });
        if (o.videoElement) {
            o.videoElement.pause();
            o.videoElement.src = "";
        }
    });
};

export const disposeConstellations = (lines, scene) => {
    lines.forEach((line) => {
        scene.remove(line);
        line.geometry.dispose();
        line.material.dispose();
    });
};