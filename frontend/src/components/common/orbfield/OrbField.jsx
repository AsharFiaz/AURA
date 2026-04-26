import { useEffect, useRef, useState, useCallback, memo } from "react";
import * as THREE from "three";

// Scene setup
import {
    buildRenderer, buildBackground, buildStars, buildDust,
    buildNebulas, buildLights, updateDust, disposeScene,
} from "./scene/setup";

// Orbs
import {
    buildOrb, buildConstellationLines, disposeOrbs, disposeConstellations,
} from "./scene/orbs";
import {
    updateOrbs, updateConstellations, resolveCollisions,
} from "./scene/orbUpdates";

// Effects
import {
    explodeShards, spawnFireBurst, updateExplosions,
} from "./effects/explosion";
import {
    spawnTrailParticle, updateMouseTrail,
} from "./effects/mouseTrail";
import {
    beginApproach, updateApproach, finishApproach,
} from "./effects/approach";

// Hooks
import {
    useCameraControls, applyCameraState,
} from "./hooks/useCameraControls";

// UI
import TopBar from "./components/TopBar";
import BottomBar from "./components/BottomBar";
import HoverCard from "./components/HoverCard";
import ExplodedContent from "./components/ExplodedContent";
import {
    OnboardingHint, FlashOverlay, Vignette, Scanlines,
} from "./components/Overlays";

// State machine values
const PHASE = {
    IDLE: "idle",
    APPROACHING: "approaching",
    EXPLODING: "exploding",   // shards spreading + fire ongoing
    READING: "reading",       // user reading the content card
    REFORMING: "reforming",   // shards coming back together
};

const OrbField = memo(({
    memories,
    currentUser,
    onLike,
    onCommentClick,
    isLiked,
    formatTime,
    onExit,
}) => {
    const mountRef = useRef(null);

    // UI state
    const [hoveredMemory, setHoveredMemory] = useState(null);
    const [hoverScreenPos, setHoverScreenPos] = useState({ x: 0, y: 0 });
    const [explodedMemory, setExplodedMemory] = useState(null);
    const [showContent, setShowContent] = useState(false);
    const [driftActive, setDriftActive] = useState(true);
    const [showOnboarding, setShowOnboarding] = useState(true);
    const [flashVisible, setFlashVisible] = useState(false);

    const driftActiveRef = useRef(true);
    useEffect(() => { driftActiveRef.current = driftActive; }, [driftActive]);

    useEffect(() => {
        const t = setTimeout(() => setShowOnboarding(false), 5000);
        return () => clearTimeout(t);
    }, []);

    // Three.js refs
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const orbsRef = useRef([]);
    const dustRef = useRef(null);
    const constellationLinesRef = useRef([]);
    const explosionsRef = useRef([]);
    const mouseTrailRef = useRef([]);
    const animFrameRef = useRef(null);
    const lastTimeRef = useRef(performance.now());

    const raycasterRef = useRef(new THREE.Raycaster());
    const pointerRef = useRef(new THREE.Vector2(-10, -10));
    const hoveredRef = useRef(null);

    // ─── State machine refs ────────────────────────────────────────────────
    const phaseRef = useRef(PHASE.IDLE);
    const activeOrbRef = useRef(null);     // the orb being acted on
    const approachRef = useRef(null);

    // ─── Click handler — kicks off APPROACHING phase ──────────────────────
    const handleOrbClick = useCallback((orb) => {
        // Force reset if stuck in any non-idle state — defensive against bugs
        if (phaseRef.current !== PHASE.IDLE) {
            const stuckOrb = activeOrbRef.current;
            if (stuckOrb) {
                stuckOrb.explodeAmount = 0;
                stuckOrb.explodeTarget = 0;
                stuckOrb.shards?.forEach((s) => s.position.set(0, 0, 0));
                stuckOrb.isExploding = false;
                stuckOrb.isApproaching = false;
                stuckOrb.hoverScale = 1;
                stuckOrb.group.scale.setScalar(1);
                stuckOrb.group.position.copy(stuckOrb.basePosition);
                stuckOrb.velocity.set(0, 0, 0);
            }
            approachRef.current = null;
            activeOrbRef.current = null;
            phaseRef.current = PHASE.IDLE;
            setShowContent(false);
            setExplodedMemory(null);
        }

        phaseRef.current = PHASE.APPROACHING;
        activeOrbRef.current = orb;
        approachRef.current = beginApproach(orb, cameraRef.current);
    }, []);

    // ─── Camera controls ──────────────────────────────────────────────────
    const cameraStateRef = useCameraControls({
        mountRef,
        cameraRef,
        pointerRef,
        hoveredRef,
        orbsRef,
        phaseRef,
        onPointerMove: (x, y) => {
            setHoverScreenPos({ x, y });
            if (sceneRef.current && cameraRef.current && phaseRef.current === PHASE.IDLE) {
                spawnTrailParticle(pointerRef.current, cameraRef.current, sceneRef.current, mouseTrailRef.current);
            }
        },
        onOrbClick: handleOrbClick,
    });

    // ─── Build scene once ─────────────────────────────────────────────────
    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        const { scene, camera, renderer } = buildRenderer(mount);
        sceneRef.current = scene;
        cameraRef.current = camera;
        rendererRef.current = renderer;

        buildBackground(scene);
        buildStars(scene);
        dustRef.current = buildDust(scene);
        buildNebulas(scene);
        buildLights(scene);

        const handleResize = () => {
            if (!mountRef.current) return;
            const w = mountRef.current.clientWidth;
            const h = mountRef.current.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            disposeScene(scene, renderer, mount);
        };
    }, []);

    // ─── Build/rebuild orbs when memories change ──────────────────────────
    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene || !memories?.length) return;

        disposeOrbs(orbsRef.current, scene);
        orbsRef.current = [];
        disposeConstellations(constellationLinesRef.current, scene);
        constellationLinesRef.current = [];

        orbsRef.current = memories.map((memory, i) => buildOrb(memory, i, memories.length, scene));
        constellationLinesRef.current = buildConstellationLines(orbsRef.current, scene);

        // Reset state in case orbs got rebuilt while a sequence was in progress
        phaseRef.current = PHASE.IDLE;
        activeOrbRef.current = null;
        approachRef.current = null;
        setShowContent(false);
        setExplodedMemory(null);
    }, [memories]);

    // ─── Close handler — initiates REFORMING ──────────────────────────────
    const handleClose = useCallback(() => {
        // Allow close from any non-idle phase (defensive — sometimes EXPLODING/READING race)
        if (phaseRef.current === PHASE.IDLE) return;
        const orb = activeOrbRef.current;
        if (!orb) {
            // Defensive: if somehow no active orb, just reset
            phaseRef.current = PHASE.IDLE;
            setShowContent(false);
            setExplodedMemory(null);
            return;
        }
        orb.explodeTarget = 0;
        phaseRef.current = PHASE.REFORMING;
        setShowContent(false);
    }, []);

    // ─── Like / comment handlers ──────────────────────────────────────────
    const handleLike = useCallback(() => {
        if (!explodedMemory) return;
        const wasLiked = isLiked?.(explodedMemory) ?? false;
        onLike?.(explodedMemory._id);
        setExplodedMemory((prev) => prev && {
            ...prev,
            likesCount: wasLiked
                ? Math.max((prev.likesCount || 0) - 1, 0)
                : (prev.likesCount || 0) + 1,
        });
    }, [explodedMemory, onLike, isLiked]);

    const handleComment = useCallback(() => {
        if (!explodedMemory) return;
        onCommentClick?.(explodedMemory);
        handleClose();
    }, [explodedMemory, onCommentClick, handleClose]);

    const resetCamera = useCallback(() => {
        const cs = cameraStateRef.current;
        cs.targetTheta = 0;
        cs.targetPhi = Math.PI / 2;
        cs.targetRadius = 22;
        cs.autoRotate = true;
        orbsRef.current.forEach((o) => {
            o.group.position.copy(o.basePosition);
            o.velocity.set(0, 0, 0);
        });
    }, [cameraStateRef]);

    // ─── Animation loop ───────────────────────────────────────────────────
    useEffect(() => {
        const tick = (now) => {
            const scene = sceneRef.current;
            const camera = cameraRef.current;
            const renderer = rendererRef.current;
            if (!scene || !camera || !renderer) {
                animFrameRef.current = requestAnimationFrame(tick);
                return;
            }

            const deltaT = Math.min((now - lastTimeRef.current) / 1000, 0.05);
            lastTimeRef.current = now;
            const time = now * 0.001;
            const cs = cameraStateRef.current;

            const phase = phaseRef.current;
            const isBusy = phase !== PHASE.IDLE;

            if (cs.autoRotate && !isBusy) cs.targetTheta += 0.0015;

            applyCameraState(cs, camera);
            updateDust(dustRef.current);
            mouseTrailRef.current = updateMouseTrail(mouseTrailRef.current, scene);
            explosionsRef.current = updateExplosions(explosionsRef.current, scene, camera);

            // ─── State machine ────────────────────────────────────────────
            const orb = activeOrbRef.current;

            if (phase === PHASE.APPROACHING && approachRef.current && orb) {
                const done = updateApproach(approachRef.current, camera, deltaT);
                if (done) {
                    finishApproach(approachRef.current);
                    approachRef.current = null;

                    // BOOM — fire effects + start shard spread
                    setFlashVisible(true);
                    setTimeout(() => setFlashVisible(false), 100);

                    const fx = spawnFireBurst(orb, scene, camera);
                    explosionsRef.current.push(...fx);

                    orb.isExploding = true;
                    orb.explodeTarget = 1;

                    phaseRef.current = PHASE.EXPLODING;

                    // After fire starts, show the HTML content card
                    setTimeout(() => {
                        if (phaseRef.current === PHASE.EXPLODING) {
                            setExplodedMemory(orb.memory);
                            setShowContent(true);
                            phaseRef.current = PHASE.READING;
                        }
                    }, 350);
                }
            }

            if (phase === PHASE.EXPLODING || phase === PHASE.READING || phase === PHASE.REFORMING) {
                if (orb) explodeShards(orb, deltaT);
            }

            if (phase === PHASE.REFORMING && orb) {
                if (orb.explodeAmount < 0.05) {
                    orb.explodeAmount = 0;
                    orb.shards.forEach((s) => s.position.set(0, 0, 0));
                    orb.isExploding = false;
                    orb.hoverScale = 1;
                    // Snap orb back to its original galaxy position
                    orb.group.position.copy(orb.basePosition);
                    orb.group.scale.setScalar(1);
                    orb.velocity.set(0, 0, 0);
                    activeOrbRef.current = null;
                    setExplodedMemory(null);
                    phaseRef.current = PHASE.IDLE;
                }
            }

            // Hover raycast — keep raycasting during drag (so hover persists),
            // only stop during busy phases (approach/explode/etc).
            let hoveredId = null;
            if (!isBusy) {
                raycasterRef.current.setFromCamera(pointerRef.current, camera);
                const proxies = orbsRef.current.filter((o) => !o.isHidden).map((o) => o.hitProxy);
                const hits = raycasterRef.current.intersectObjects(proxies, false);
                if (hits.length) hoveredId = hits[0].object.userData.memoryId;
            }

            updateOrbs({
                orbs: orbsRef.current,
                camera,
                cameraState: cs,
                time,
                hoveredId,
                driftActive: driftActiveRef.current,
                revealActive: isBusy,
            });

            updateConstellations(constellationLinesRef.current, time);
            resolveCollisions(orbsRef.current);

            // Update hovered memory state — but DON'T clear hover during drag,
            // otherwise the click release loses its target.
            const liveOrbs = orbsRef.current.filter((o) => !o.isHidden);
            if (cs.isDragging) {
                // Preserve whatever was hovered when drag started — onUp needs this
            } else {
                hoveredRef.current = hoveredId
                    ? liveOrbs.find((o) => o.memory._id === hoveredId)?.memory ?? null
                    : null;
            }

            if (hoveredId && hoveredRef.current && hoveredMemory?._id !== hoveredId) {
                setHoveredMemory(hoveredRef.current);
            } else if (!hoveredId && hoveredMemory) {
                setHoveredMemory(null);
            }

            renderer.render(scene, camera);
            animFrameRef.current = requestAnimationFrame(tick);
        };

        lastTimeRef.current = performance.now();
        animFrameRef.current = requestAnimationFrame(tick);
        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [hoveredMemory, cameraStateRef]);

    const liked = explodedMemory ? isLiked?.(explodedMemory) ?? false : false;
    const isBusy = phaseRef.current !== PHASE.IDLE;

    return (
        <div className="fixed inset-0 z-[100] overflow-hidden" style={{ background: "#02020a" }}>
            <div ref={mountRef} className="absolute inset-0" />

            <FlashOverlay visible={flashVisible} />
            <Vignette />
            <Scanlines />

            <TopBar
                memoriesCount={memories?.length || 0}
                driftActive={driftActive}
                onToggleDrift={() => setDriftActive((v) => !v)}
                onResetCamera={resetCamera}
                onExit={onExit}
            />

            <OnboardingHint visible={showOnboarding} />

            {!explodedMemory && !isBusy && <BottomBar />}

            <HoverCard
                memory={hoveredMemory}
                position={hoverScreenPos}
                formatTime={formatTime}
                visible={!!hoveredMemory && !isBusy}
            />

            <ExplodedContent
                memory={explodedMemory}
                visible={showContent}
                isLiked={liked}
                formatTime={formatTime}
                onLike={handleLike}
                onComment={handleComment}
                onClose={handleClose}
            />
        </div>
    );
});

OrbField.displayName = "OrbField";

export default OrbField;