import { useEffect, useRef } from "react";
import * as THREE from "three";

// ─── useCameraControls ───────────────────────────────────────────────────────
// Wires pointer/touch/wheel handlers to the mount node and updates an
// internal cameraState ref. Also handles orb dragging when an orb is hovered.
export const useCameraControls = ({
    mountRef,
    cameraRef,
    pointerRef,
    hoveredRef,
    orbsRef,
    phaseRef,
    onPointerMove,
    onOrbClick,
}) => {
    const cameraStateRef = useRef({
        radius: 22,
        targetRadius: 22,
        theta: 0,
        phi: Math.PI / 2,
        targetTheta: 0,
        targetPhi: Math.PI / 2,
        isDragging: false,
        isDraggingOrb: false,
        draggedOrbId: null,
        dragStartX: 0,
        dragStartY: 0,
        lastX: 0,
        lastY: 0,
        movedDuringDrag: false,
        autoRotate: true,
        worldDragVelocity: new THREE.Vector3(),
        shakeIntensity: 0,
        shakeOffsetX: 0,
        shakeOffsetY: 0,
    });

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        const setPointer = (e) => {
            const rect = mount.getBoundingClientRect();
            pointerRef.current.set(
                ((e.clientX - rect.left) / rect.width) * 2 - 1,
                -((e.clientY - rect.top) / rect.height) * 2 + 1
            );
            onPointerMove?.(e.clientX - rect.left, e.clientY - rect.top);
        };

        const onMove = (e) => {
            setPointer(e);
            const cs = cameraStateRef.current;
            if (!cs.isDragging) return;

            const dx = e.clientX - cs.lastX;
            const dy = e.clientY - cs.lastY;
            if (Math.abs(e.clientX - cs.dragStartX) > 4 || Math.abs(e.clientY - cs.dragStartY) > 4) {
                cs.movedDuringDrag = true;
            }

            if (cs.isDraggingOrb && cs.draggedOrbId) {
                const orb = orbsRef.current.find((o) => o.memory._id === cs.draggedOrbId);
                if (orb) {
                    const camera = cameraRef.current;
                    const vec = new THREE.Vector3(pointerRef.current.x, pointerRef.current.y, 0.5);
                    vec.unproject(camera);
                    const dir = vec.sub(camera.position).normalize();
                    const targetZ = orb.group.position.z;
                    const t = (targetZ - camera.position.z) / dir.z;
                    const targetWorld = camera.position.clone().add(dir.multiplyScalar(t));

                    const desiredVel = new THREE.Vector3(
                        (targetWorld.x - orb.group.position.x) * 0.3,
                        (targetWorld.y - orb.group.position.y) * 0.3,
                        0
                    );
                    orb.velocity.copy(desiredVel);
                    cs.worldDragVelocity.copy(desiredVel);
                }
            } else {
                cs.targetTheta -= dx * 0.005;
                cs.targetPhi = Math.max(0.15, Math.min(Math.PI - 0.15, cs.targetPhi - dy * 0.005));
            }
            cs.lastX = e.clientX;
            cs.lastY = e.clientY;
            cs.autoRotate = false;
        };

        const onDown = (e) => {
            if (phaseRef.current !== "idle") return;

            const cs = cameraStateRef.current;
            cs.isDragging = true;
            cs.movedDuringDrag = false;
            cs.dragStartX = cs.lastX = e.clientX;
            cs.dragStartY = cs.lastY = e.clientY;

            if (hoveredRef.current) {
                cs.isDraggingOrb = true;
                cs.draggedOrbId = hoveredRef.current._id;
                mount.style.cursor = "grabbing";
            } else {
                cs.isDraggingOrb = false;
                cs.draggedOrbId = null;
                mount.style.cursor = "grabbing";
            }
        };

        const onUp = () => {
            const cs = cameraStateRef.current;
            const wasDragging = cs.isDragging;
            const wasOrbDrag = cs.isDraggingOrb;
            const draggedId = cs.draggedOrbId;
            cs.isDragging = false;
            cs.isDraggingOrb = false;
            cs.draggedOrbId = null;
            mount.style.cursor = "grab";

            // Click-without-movement on a hovered orb → trigger detonation
            if (wasDragging && !cs.movedDuringDrag && hoveredRef.current && phaseRef.current === "idle") {
                const orb = orbsRef.current.find((o) => o.memory._id === hoveredRef.current._id);
                if (orb) onOrbClick?.(orb);
            } else if (wasOrbDrag && cs.movedDuringDrag && draggedId) {
                const orb = orbsRef.current.find((o) => o.memory._id === draggedId);
                if (orb) {
                    orb.velocity.copy(cs.worldDragVelocity).multiplyScalar(0.3);
                }
            }
        };

        const onLeave = () => {
            cameraStateRef.current.isDragging = false;
            cameraStateRef.current.isDraggingOrb = false;
            mount.style.cursor = "grab";
        };

        const onWheel = (e) => {
            e.preventDefault();
            const cs = cameraStateRef.current;
            cs.targetRadius = Math.max(6, Math.min(50, cs.targetRadius + e.deltaY * 0.018));
            cs.autoRotate = false;
        };

        let pinchDist = 0;
        const onTouchStart = (e) => {
            if (phaseRef.current !== "idle") return;
            const cs = cameraStateRef.current;
            if (e.touches.length === 1) {
                cs.isDragging = true;
                cs.movedDuringDrag = false;
                cs.dragStartX = cs.lastX = e.touches[0].clientX;
                cs.dragStartY = cs.lastY = e.touches[0].clientY;
                if (hoveredRef.current) {
                    cs.isDraggingOrb = true;
                    cs.draggedOrbId = hoveredRef.current._id;
                }
            } else if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                pinchDist = Math.hypot(dx, dy);
            }
            cs.autoRotate = false;
        };

        const onTouchMove = (e) => {
            e.preventDefault();
            const cs = cameraStateRef.current;
            if (e.touches.length === 1 && cs.isDragging) {
                const t = e.touches[0];
                const dx = t.clientX - cs.lastX;
                const dy = t.clientY - cs.lastY;
                if (Math.abs(t.clientX - cs.dragStartX) > 4 || Math.abs(t.clientY - cs.dragStartY) > 4) {
                    cs.movedDuringDrag = true;
                }
                cs.targetTheta -= dx * 0.005;
                cs.targetPhi = Math.max(0.15, Math.min(Math.PI - 0.15, cs.targetPhi - dy * 0.005));
                cs.lastX = t.clientX;
                cs.lastY = t.clientY;
            } else if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const d = Math.hypot(dx, dy);
                cs.targetRadius = Math.max(6, Math.min(50, cs.targetRadius + (pinchDist - d) * 0.05));
                pinchDist = d;
            }
        };

        const onTouchEnd = () => {
            const cs = cameraStateRef.current;
            cs.isDragging = false;
            cs.isDraggingOrb = false;
            cs.draggedOrbId = null;
            if (!cs.movedDuringDrag && hoveredRef.current && phaseRef.current === "idle") {
                const orb = orbsRef.current.find((o) => o.memory._id === hoveredRef.current._id);
                if (orb) onOrbClick?.(orb);
            }
        };

        mount.addEventListener("pointermove", onMove);
        mount.addEventListener("pointerdown", onDown);
        mount.addEventListener("pointerup", onUp);
        mount.addEventListener("pointerleave", onLeave);
        mount.addEventListener("wheel", onWheel, { passive: false });
        mount.addEventListener("touchstart", onTouchStart, { passive: false });
        mount.addEventListener("touchmove", onTouchMove, { passive: false });
        mount.addEventListener("touchend", onTouchEnd);
        mount.style.cursor = "grab";

        return () => {
            mount.removeEventListener("pointermove", onMove);
            mount.removeEventListener("pointerdown", onDown);
            mount.removeEventListener("pointerup", onUp);
            mount.removeEventListener("pointerleave", onLeave);
            mount.removeEventListener("wheel", onWheel);
            mount.removeEventListener("touchstart", onTouchStart);
            mount.removeEventListener("touchmove", onTouchMove);
            mount.removeEventListener("touchend", onTouchEnd);
        };
    }, [mountRef, cameraRef, pointerRef, hoveredRef, orbsRef, phaseRef, onPointerMove, onOrbClick]);

    return cameraStateRef;
};

// ─── Apply camera state to the actual three.js camera each frame ─────────────
export const applyCameraState = (cameraState, camera) => {
    const cs = cameraState;
    cs.theta += (cs.targetTheta - cs.theta) * 0.08;
    cs.phi += (cs.targetPhi - cs.phi) * 0.08;
    cs.radius += (cs.targetRadius - cs.radius) * 0.08;

    // Screen shake decay
    if (cs.shakeIntensity > 0.001) {
        cs.shakeOffsetX = (Math.random() - 0.5) * cs.shakeIntensity;
        cs.shakeOffsetY = (Math.random() - 0.5) * cs.shakeIntensity;
        cs.shakeIntensity *= 0.88;
    } else {
        cs.shakeOffsetX = 0;
        cs.shakeOffsetY = 0;
    }

    camera.position.x = cs.radius * Math.sin(cs.phi) * Math.cos(cs.theta) + cs.shakeOffsetX;
    camera.position.y = cs.radius * Math.cos(cs.phi) + cs.shakeOffsetY;
    camera.position.z = cs.radius * Math.sin(cs.phi) * Math.sin(cs.theta);
    camera.lookAt(0, 0, 0);
};