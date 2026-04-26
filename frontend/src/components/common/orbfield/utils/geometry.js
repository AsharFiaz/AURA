import * as THREE from "three";

// ─── Shard geometry — irregular triangle pieces of a sphere/shape ─────────────
// Used when an orb shatters. Returns array of { geometry, centroid, normal }
export const buildShardGeometries = (radius, count = 24, sourceShape = "sphere") => {
    const shards = [];
    let source;
    if (sourceShape === "ico") {
        source = new THREE.IcosahedronGeometry(radius, 1);
    } else if (sourceShape === "octa") {
        source = new THREE.OctahedronGeometry(radius, 2);
    } else if (sourceShape === "dodeca") {
        source = new THREE.DodecahedronGeometry(radius, 1);
    } else {
        source = new THREE.IcosahedronGeometry(radius, 1);
    }

    const positions = source.attributes.position;
    const faceCount = positions.count / 3;

    for (let i = 0; i < Math.min(faceCount, count); i++) {
        const geo = new THREE.BufferGeometry();
        const verts = new Float32Array(9);
        const normals = new Float32Array(9);
        for (let v = 0; v < 3; v++) {
            const idx = i * 3 + v;
            verts[v * 3] = positions.getX(idx);
            verts[v * 3 + 1] = positions.getY(idx);
            verts[v * 3 + 2] = positions.getZ(idx);
        }
        const a = new THREE.Vector3(verts[0], verts[1], verts[2]);
        const b = new THREE.Vector3(verts[3], verts[4], verts[5]);
        const c = new THREE.Vector3(verts[6], verts[7], verts[8]);
        const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
        for (let v = 0; v < 3; v++) {
            normals[v * 3] = n.x;
            normals[v * 3 + 1] = n.y;
            normals[v * 3 + 2] = n.z;
        }
        geo.setAttribute("position", new THREE.BufferAttribute(verts, 3));
        geo.setAttribute("normal", new THREE.BufferAttribute(normals, 3));

        const centroid = new THREE.Vector3(
            (verts[0] + verts[3] + verts[6]) / 3,
            (verts[1] + verts[4] + verts[7]) / 3,
            (verts[2] + verts[5] + verts[8]) / 3
        );

        shards.push({ geometry: geo, centroid, normal: n });
    }
    source.dispose();
    return shards;
};

// ─── Personality-driven orb shape ────────────────────────────────────────────
// Returns the appropriate geometry for the dominant trait so each orb feels
// distinct. Shape encodes personality at-a-glance.
export const buildOrbGeometry = (radius, traitShape) => {
    switch (traitShape) {
        case "crystal": // Openness — sharp icosahedron
            return new THREE.IcosahedronGeometry(radius, 0);
        case "geode": // Conscientiousness — clean dodecahedron
            return new THREE.DodecahedronGeometry(radius, 0);
        case "sun": // Extraversion — smooth sphere with high detail (radiant)
            return new THREE.SphereGeometry(radius, 64, 64);
        case "bloom": // Agreeableness — octahedron (soft star)
            return new THREE.OctahedronGeometry(radius, 1);
        case "storm": // Neuroticism — torus knot (turbulent)
            return new THREE.IcosahedronGeometry(radius, 2);
        default:
            return new THREE.SphereGeometry(radius, 64, 64);
    }
};

// Get the matching shard source for a given orb shape
export const getShardSourceFor = (traitShape) => {
    switch (traitShape) {
        case "crystal": return "ico";
        case "geode": return "dodeca";
        case "bloom": return "octa";
        default: return "ico";
    }
};