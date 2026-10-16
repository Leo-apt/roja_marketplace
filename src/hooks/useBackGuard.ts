import { useEffect, useRef } from "react";

/**
 * Keeps one extra history entry while the drawer is open.
 * Browser Back then lands on that entry instead of leaving the page,
 * and onBack decides what to do (confirm if dirty, otherwise close).
 */
export function useBackGuard(dirty: boolean, onBack: () => void) {
    const dirtyRef = useRef(dirty);
    dirtyRef.current = dirty;
    const backRef = useRef(onBack);
    backRef.current = onBack;

    useEffect(() => {
        let holding = false;
        const t = window.setTimeout(() => {
            window.history.pushState(window.history.state, "", window.location.href);
            holding = true;
        }, 0);
        const onPop = () => {
            if (!holding) return;
            if (dirtyRef.current) {
                // stay on the page: put the entry back, then ask
                window.history.pushState(window.history.state, "", window.location.href);
            } else {
                holding = false; // Back already used up our entry
            }
            backRef.current();
        };
        window.addEventListener("popstate", onPop);
        return () => {
            window.clearTimeout(t);
            window.removeEventListener("popstate", onPop);
            if (holding) window.history.back(); // drawer closed normally: remove our extra entry
        };
    }, []);
}