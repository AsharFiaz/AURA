import * as THREE from "three";
import { getGlowTexture } from "../utils/textures";

// Spawn a single trail particle at the world position projected from the pointer
export const spawnTrailParticle = (pointer, camera, scene, trailArray) => {
    if (Math.random() >= 0.4) return; // throttle

    const vec = new THREE.Vector3(pointer.x, pointer.y, 0.5);
    vec.unproject(camera);
    const dir = vec.sub(camera.position).normalize();
    const distance = -camera.position.z / dir.z;
    const pos = camera.position.clone().add(dir.multiplyScalar(distance));

    const trailMat = new THREE.SpriteMaterial({
        map: getGlowTexture(),
        color: 0xa5b4fc,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    const trail = new THREE.Sprite(trailMat);
    trail.position.copy(pos);
    trail.scale.setScalar(0.3);
    scene.add(trail);
    trailArray.push({ sprite: trail, life: 1.0 });

    // Cap trail length
    if (trailArray.length > 60) {
        const old = trailArray.shift();
        scene.remove(old.sprite);
        old.sprite.material.dispose();
    }
};

// Update all trail particles per frame
export const updateMouseTrail = (trailArray, scene) => {
    return trailArray.filter((trail) => {
        trail.life -= 0.025;
        if (trail.life <= 0) {
            scene.remove(trail.sprite);
            trail.sprite.material.dispose();
            return false;
        }
        trail.sprite.material.opacity = trail.life * 0.7;
        trail.sprite.scale.setScalar(0.3 * trail.life);
        return true;
    });
};