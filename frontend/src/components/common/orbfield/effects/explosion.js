import * as THREE from "three";
import { getGlowTexture, getFireTexture, getSmokeTexture } from "../utils/textures";

// ─── EXPLODE — wass08 style ──────────────────────────────────────────────────
// Pre-fractured shards already exist on the orb. We just animate one number:
// orb.explodeAmount (0 = joined, 1 = fully exploded). Each frame, every shard
// is positioned at originDir * (baseSize * explodeAmount * spread).
//
// On click we ALSO spawn fire/embers/smoke as one-shot effects to make the
// shattering moment visually loud. Those effects live in the explosionsRef
// array exactly like before.

export const explodeShards = (orb, deltaT) => {
    if (!orb.shards) return;
    const target = orb.explodeTarget ?? 0;
    // Smoothly lerp toward target
    const speed = orb.explodeAmount < target ? 4.0 : 2.5; // explode faster than reform
    orb.explodeAmount = THREE.MathUtils.lerp(
        orb.explodeAmount,
        target,
        Math.min(speed * deltaT, 1)
    );

    const e = orb.explodeAmount;
    const SPREAD = 4.5; // how far shards fly out (in baseSize units)

    orb.shards.forEach((shard) => {
        const dir = shard.userData.outwardDir;
        const dist = orb.baseSize * SPREAD * e;
        shard.position.set(dir.x * dist, dir.y * dist, dir.z * dist);

        // Spin the shards as they fly
        shard.rotation.x += shard.userData.spinSpeed * deltaT * e * 2;
        shard.rotation.y += shard.userData.spinSpeed * deltaT * e * 1.5;

        // Fade out as they spread
        shard.material.opacity = THREE.MathUtils.lerp(0.3, 0.0, e);
    });

    // Hide the core inner sphere is NOT done — we want it visible during
    // explosion so the content shows. Instead the shell shards just spread
    // open like a flower revealing the seed inside.
};

// ─── Spawn one-shot fire/embers/smoke at moment of explosion ────────────────
export const spawnFireBurst = (orb, scene, camera) => {
    const orbWorldPos = orb.group.position.clone();
    const trait = orb.trait;
    const glowTex = getGlowTexture();
    const fireTex = getFireTexture();
    const smokeTex = getSmokeTexture();
    const effects = [];

    // Fireball
    const fireball = new THREE.Sprite(new THREE.SpriteMaterial({
        map: fireTex,
        color: 0xffffff,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    }));
    fireball.position.copy(orbWorldPos);
    fireball.scale.setScalar(orb.baseSize * 1.5);
    scene.add(fireball);
    effects.push({
        type: "fireball",
        sprite: fireball,
        life: 1.0,
        baseSize: orb.baseSize,
    });

    // Fire particles (tinted with trait color)
    const fireCount = 80;
    const fireParticles = [];
    for (let i = 0; i < fireCount; i++) {
        const fireColor = new THREE.Color(0xffaa33).lerp(new THREE.Color(trait.hex), 0.3);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: fireTex,
            color: fireColor,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }));
        sprite.position.copy(orbWorldPos);
        const ringTheta = Math.random() * Math.PI * 2;
        const ringPhi = Math.acos(2 * Math.random() - 1);
        const speed = 0.15 + Math.random() * 0.45;
        sprite.scale.setScalar(orb.baseSize * (0.4 + Math.random() * 0.3));
        scene.add(sprite);
        fireParticles.push({
            sprite,
            velocity: new THREE.Vector3(
                Math.sin(ringPhi) * Math.cos(ringTheta) * speed,
                Math.sin(ringPhi) * Math.sin(ringTheta) * speed,
                Math.cos(ringPhi) * speed
            ),
            buoyancy: 0.0008 + Math.random() * 0.0006,
            baseSize: orb.baseSize * (0.4 + Math.random() * 0.3),
        });
    }
    effects.push({ type: "fireParticles", particles: fireParticles, life: 1.0 });

    // Embers
    const emberCount = 60;
    const embers = [];
    for (let i = 0; i < emberCount; i++) {
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: glowTex,
            color: 0xffe4a0,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }));
        sprite.position.copy(orbWorldPos);
        sprite.scale.setScalar(orb.baseSize * 0.15);
        const t = Math.random() * Math.PI * 2;
        const p = Math.acos(2 * Math.random() - 1);
        const sp = 0.3 + Math.random() * 0.6;
        scene.add(sprite);
        embers.push({
            sprite,
            velocity: new THREE.Vector3(
                Math.sin(p) * Math.cos(t) * sp,
                Math.sin(p) * Math.sin(t) * sp,
                Math.cos(p) * sp
            ),
            gravity: -0.002,
            baseSize: orb.baseSize * 0.15,
        });
    }
    effects.push({ type: "embers", embers, life: 1.5 });

    // Smoke puffs
    const smoke = [];
    for (let i = 0; i < 12; i++) {
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: smokeTex,
            color: 0xa0a0b8,
            transparent: true,
            opacity: 0,
            blending: THREE.NormalBlending,
            depthWrite: false,
        }));
        sprite.position.copy(orbWorldPos);
        sprite.position.x += (Math.random() - 0.5) * orb.baseSize;
        sprite.position.y += (Math.random() - 0.5) * orb.baseSize * 0.5;
        sprite.position.z += (Math.random() - 0.5) * orb.baseSize;
        sprite.scale.setScalar(orb.baseSize * 1.2);
        scene.add(sprite);
        smoke.push({
            sprite,
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.02,
                0.04 + Math.random() * 0.03,
                (Math.random() - 0.5) * 0.02
            ),
            delay: i * 0.04,
            elapsed: 0,
            baseSize: orb.baseSize * 1.2,
        });
    }
    effects.push({ type: "smoke", puffs: smoke, life: 2.5 });

    // Shockwaves (stacked rings)
    const ring = new THREE.Mesh(
        new THREE.RingGeometry(orb.baseSize * 0.5, orb.baseSize * 0.7, 64),
        new THREE.MeshBasicMaterial({
            color: trait.hex, transparent: true, opacity: 1,
            side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
        })
    );
    ring.position.copy(orbWorldPos);
    ring.lookAt(camera.position);
    scene.add(ring);

    const ring2 = new THREE.Mesh(
        new THREE.RingGeometry(orb.baseSize * 0.3, orb.baseSize * 0.4, 64),
        new THREE.MeshBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 1,
            side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
        })
    );
    ring2.position.copy(orbWorldPos);
    ring2.lookAt(camera.position);
    scene.add(ring2);

    const ring3 = new THREE.Mesh(
        new THREE.RingGeometry(orb.baseSize * 0.7, orb.baseSize * 0.85, 64),
        new THREE.MeshBasicMaterial({
            color: 0xff6020, transparent: true, opacity: 0.9,
            side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
        })
    );
    ring3.position.copy(orbWorldPos);
    ring3.lookAt(camera.position);
    scene.add(ring3);

    effects.push({
        type: "shockwaves",
        ring, ring2, ring3,
        ringScale: 1, ring2Scale: 1, ring3Scale: 1,
        life: 1.0,
        baseSize: orb.baseSize,
    });

    // Flash light
    const flashLight = new THREE.PointLight(0xff8030, 12, 40);
    flashLight.position.copy(orbWorldPos);
    scene.add(flashLight);
    effects.push({ type: "flashLight", light: flashLight, life: 1.0 });

    return effects;
};

// ─── Update one-shot effects per frame ───────────────────────────────────────
export const updateExplosions = (explosions, scene, camera) => {
    return explosions.filter((ex) => {
        ex.life -= 0.018;

        if (ex.type === "fireball") {
            if (ex.life <= 0) {
                scene.remove(ex.sprite);
                ex.sprite.material.dispose();
                return false;
            }
            const t = 1 - ex.life;
            ex.sprite.scale.setScalar(ex.baseSize * (1.5 + t * 4));
            ex.sprite.material.opacity = ex.life * ex.life;
            return true;
        }

        if (ex.type === "fireParticles") {
            if (ex.life <= 0) {
                ex.particles.forEach((p) => {
                    scene.remove(p.sprite);
                    p.sprite.material.dispose();
                });
                return false;
            }
            ex.particles.forEach((p) => {
                p.sprite.position.add(p.velocity);
                p.velocity.multiplyScalar(0.93);
                p.velocity.y += p.buoyancy;
                p.sprite.material.opacity = ex.life * ex.life;
                p.sprite.scale.setScalar(p.baseSize * (0.6 + ex.life * 0.6));
            });
            return true;
        }

        if (ex.type === "embers") {
            if (ex.life <= 0) {
                ex.embers.forEach((e) => {
                    scene.remove(e.sprite);
                    e.sprite.material.dispose();
                });
                return false;
            }
            ex.embers.forEach((e) => {
                e.sprite.position.add(e.velocity);
                e.velocity.y += e.gravity;
                e.velocity.multiplyScalar(0.985);
                const tw = 0.7 + Math.sin(performance.now() * 0.02 + e.sprite.position.x * 10) * 0.3;
                e.sprite.material.opacity = ex.life * tw;
            });
            return true;
        }

        if (ex.type === "smoke") {
            if (ex.life <= 0) {
                ex.puffs.forEach((p) => {
                    scene.remove(p.sprite);
                    p.sprite.material.dispose();
                });
                return false;
            }
            ex.puffs.forEach((p) => {
                p.elapsed += 0.018;
                if (p.elapsed < p.delay) return;
                const localT = (p.elapsed - p.delay) / 1.5;
                p.sprite.position.add(p.velocity);
                p.velocity.multiplyScalar(0.99);
                const fadeIn = Math.min(localT * 3, 1);
                const fadeOut = Math.max(1 - localT * 0.6, 0);
                p.sprite.material.opacity = fadeIn * fadeOut * 0.4;
                p.sprite.scale.setScalar(p.baseSize * (1 + localT * 2));
                p.sprite.material.rotation += 0.005;
            });
            return true;
        }

        if (ex.type === "shockwaves") {
            if (ex.life <= 0) {
                [ex.ring, ex.ring2, ex.ring3].forEach((r) => {
                    scene.remove(r);
                    r.geometry.dispose();
                    r.material.dispose();
                });
                return false;
            }
            ex.ringScale += (1 - ex.life) * 0.5 + 0.18;
            ex.ring.scale.setScalar(ex.ringScale * 4);
            ex.ring.material.opacity = ex.life * 0.8;
            ex.ring.lookAt(camera.position);

            ex.ring2Scale += 0.5;
            ex.ring2.scale.setScalar(ex.ring2Scale * 2);
            ex.ring2.material.opacity = ex.life * 0.6;
            ex.ring2.lookAt(camera.position);

            ex.ring3Scale += 0.25;
            ex.ring3.scale.setScalar(ex.ring3Scale * 3);
            ex.ring3.material.opacity = ex.life * 0.5;
            ex.ring3.lookAt(camera.position);
            return true;
        }

        if (ex.type === "flashLight") {
            if (ex.life <= 0) {
                scene.remove(ex.light);
                return false;
            }
            ex.light.intensity = ex.life * 12;
            return true;
        }

        return false;
    });
};