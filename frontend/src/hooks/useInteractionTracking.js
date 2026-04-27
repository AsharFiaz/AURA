import { useEffect, useRef, useCallback } from "react";
import api from "../utils/api";

/**
 * useInteractionTracking
 * --------------------------------------------------------------------------
 * Buffers Home-feed interactions in memory and flushes them in batches to
 * `POST /api/interactions/batch`. On unload, falls back to navigator.sendBeacon
 * so the last batch survives tab-close.
 *
 * Returned API:
 *   trackView({ memoryId, dwellSeconds })   — for IntersectionObserver dwell timing
 *   trackEvent({ memoryId, type })          — like / comment / bookmark / profile_visit / expand
 *   flushNow()                              — force-flush before logout
 *
 * Self-interactions are filtered server-side too, but we drop them at the
 * source to avoid wasted bandwidth.
 */
export const useInteractionTracking = ({ enabled = true, currentUserId } = {}) => {
    const buffer = useRef([]);                // [{ memoryId, type, dwellSeconds? }]
    const flushTimer = useRef(null);
    const FLUSH_INTERVAL_MS = 8000;           // batch every 8s
    const MAX_BUFFER = 50;                    // or when buffer hits 50 events

    // ── Flush buffer to server ──────────────────────────────────────────────
    const flush = useCallback(async () => {
        if (!enabled) return;
        if (buffer.current.length === 0) return;

        const events = buffer.current;
        buffer.current = [];
        if (flushTimer.current) {
            clearTimeout(flushTimer.current);
            flushTimer.current = null;
        }

        try {
            await api.post("/interactions/batch", { events });
        } catch (err) {
            // Non-blocking: put events back so we retry on next flush
            // (cap to MAX_BUFFER * 4 to prevent runaway growth on persistent failure)
            buffer.current = [...events, ...buffer.current].slice(0, MAX_BUFFER * 4);
        }
    }, [enabled]);

    // ── Schedule a flush if not already scheduled ───────────────────────────
    const scheduleFlush = useCallback(() => {
        if (flushTimer.current) return;
        flushTimer.current = setTimeout(() => {
            flushTimer.current = null;
            flush();
        }, FLUSH_INTERVAL_MS);
    }, [flush]);

    // ── Add to buffer ───────────────────────────────────────────────────────
    const enqueue = useCallback((event) => {
        if (!enabled) return;
        if (!event?.memoryId || !event?.type) return;

        buffer.current.push(event);

        if (buffer.current.length >= MAX_BUFFER) {
            flush();
        } else {
            scheduleFlush();
        }
    }, [enabled, flush, scheduleFlush]);

    // ── Public methods ──────────────────────────────────────────────────────
    const trackView = useCallback(({ memoryId, dwellSeconds, memoryOwnerId }) => {
        if (!memoryId || !dwellSeconds || dwellSeconds <= 0) return;
        if (currentUserId && memoryOwnerId && String(memoryOwnerId) === String(currentUserId)) return; // skip self
        enqueue({ memoryId, type: "view", dwellSeconds });
    }, [enqueue, currentUserId]);

    const trackEvent = useCallback(({ memoryId, type, memoryOwnerId }) => {
        if (!memoryId || !type) return;
        if (currentUserId && memoryOwnerId && String(memoryOwnerId) === String(currentUserId)) return; // skip self
        enqueue({ memoryId, type });
    }, [enqueue, currentUserId]);

    const flushNow = useCallback(() => flush(), [flush]);

    // ── Periodic flush + unload handler ─────────────────────────────────────
    useEffect(() => {
        if (!enabled) return undefined;

        const handleBeforeUnload = () => {
            if (buffer.current.length === 0) return;

            // sendBeacon survives page unload. Backend accepts text/plain as JSON.
            try {
                const payload = JSON.stringify({ events: buffer.current });
                const url = `${api.defaults.baseURL}/interactions/batch`;
                const blob = new Blob([payload], { type: "application/json" });

                // sendBeacon doesn't carry our auth header, so fall through to
                // a synchronous-ish fetch with keepalive when we have a token.
                const token = localStorage.getItem("token");
                if (token) {
                    fetch(url, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: payload,
                        keepalive: true,
                    }).catch(() => { });
                } else {
                    navigator.sendBeacon(url, blob);
                }
                buffer.current = [];
            } catch {
                /* swallow — best effort */
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        window.addEventListener("pagehide", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            window.removeEventListener("pagehide", handleBeforeUnload);
            // Flush whatever is left when the hook unmounts (e.g., navigating away from Home)
            flush();
            if (flushTimer.current) {
                clearTimeout(flushTimer.current);
                flushTimer.current = null;
            }
        };
    }, [enabled, flush]);

    return { trackView, trackEvent, flushNow };
};