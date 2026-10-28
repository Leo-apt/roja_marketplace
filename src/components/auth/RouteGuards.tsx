import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Check, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/roja-logo.png";

/* ───────────────────────── Loader setup (edit here) ─────────────────────────
   Text and timing live in this one object. Bar colours come from the theme
   tokens in index.css (brand-300 to brand-700). The logo is shown exactly as
   the image file is, with no tint or filter. */
const LOADER = {
  steps: [
    "Verifying your session",
    "Loading your workspace",
    "Syncing marketplace data",
  ],
  doneText: "All set",
  stepMs: 900, // time each status line stays on screen
  minMs: 2000, // the loader is always shown at least this long
  exitMs: 650, // short "all set" moment, then fade out
  secureNote: "Secure connection",
} as const;

// dark at the edges, light in the middle, so the wave looks like it has depth
const BARS = [
  "bg-brand-700",
  "bg-brand-600",
  "bg-brand-500",
  "bg-brand-300",
  "bg-brand-500",
  "bg-brand-600",
  "bg-brand-700",
] as const;

const Loading = ({ finishing = false }: { finishing?: boolean }) => {
  const { steps, doneText, stepMs, secureNote } = LOADER;

  // status line moves through the steps and stays on the last one until ready
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (finishing || step >= steps.length - 1) return;
    const id = window.setTimeout(() => setStep((s) => s + 1), stepMs);
    return () => window.clearTimeout(id);
  }, [step, finishing, steps.length, stepMs]);

  const label = finishing ? doneText : steps[step];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={!finishing}
      aria-label="Loading"
      className={`ld-root relative grid min-h-screen place-items-center overflow-hidden bg-page text-ink ${finishing ? "ld-leaving" : ""
        }`}
    >
      {/* faint dotted grid, fading out toward the edges */}
      <div className="ld-grid pointer-events-none absolute inset-0" />
      {/* soft glow behind the logo */}
      <div className="ld-glow pointer-events-none absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-3xl" />

      <div className="relative z-10 flex flex-col items-center px-6">
        {/* Logo, shown with its original colours */}
        <img
          src={logo}
          alt="Roja Marketplace"
          className="ld-logo h-14 w-auto max-w-[200px] object-contain"
        />

        {/* Wave bars */}
        <div
          aria-hidden="true"
          className="mt-10 flex h-10 items-center gap-1.5"
        >
          {BARS.map((color, i) => (
            <span
              key={i}
              className={`ld-bar block h-10 w-1.5 rounded-full ${color}`}
              style={{ animationDelay: `${i * 110}ms` }}
            />
          ))}
        </div>

        {/* Status line: fades in each time the text changes */}
        <p
          key={finishing ? "done" : step}
          className={`ld-text mt-7 flex h-5 items-center gap-2 text-sm font-medium ${finishing ? "text-ink" : "text-muted"
            }`}
        >
          {finishing && (
            <span className="ld-pop grid size-4 place-items-center rounded-full bg-brand text-white">
              <Check className="size-2.5" strokeWidth={3} />
            </span>
          )}
          {label}
        </p>

        {/* Trust note */}
        <p className="mt-14 flex items-center gap-1.5 text-xs text-muted">
          <Lock className="size-3" />
          {secureNote}
        </p>
      </div>

      <style>{`
        @keyframes ld-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ld-out {
          0%, 40% { opacity: 1; }
          100%    { opacity: 0; }
        }
        @keyframes ld-logo-in {
          from { opacity: 0; transform: translateY(8px) scale(0.96); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes ld-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-3px); }
        }
        @keyframes ld-breathe {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.06); }
        }
        @keyframes ld-bar {
          0%, 100% { transform: scaleY(0.28); opacity: 0.7; }
          50%      { transform: scaleY(1);    opacity: 1; }
        }
        @keyframes ld-text-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ld-pop {
          0%   { transform: scale(0.4); }
          70%  { transform: scale(1.15); }
          100% { transform: scale(1); }
        }

        .ld-root { animation: ld-fade-in 400ms ease-out both; }
        .ld-root.ld-leaving { animation: ld-out ${LOADER.exitMs}ms ease-in forwards; }
        .ld-grid {
          background-image: radial-gradient(var(--color-field-border) 1px, transparent 1px);
          background-size: 24px 24px;
          opacity: 0.5;
          -webkit-mask-image: radial-gradient(circle at center, #000 0%, transparent 60%);
                  mask-image: radial-gradient(circle at center, #000 0%, transparent 60%);
        }
        .ld-glow { animation: ld-breathe 3.2s ease-in-out infinite; }
        .ld-logo {
          animation:
            ld-logo-in 600ms cubic-bezier(.2,.8,.2,1) both,
            ld-float 3.4s 600ms ease-in-out infinite;
        }
        .ld-bar {
          transform-origin: center;
          animation: ld-bar 1.1s ease-in-out infinite;
        }
        .ld-text { animation: ld-text-in 320ms ease-out both; }
        .ld-pop  { animation: ld-pop 300ms ease-out both; }

        @media (prefers-reduced-motion: reduce) {
          .ld-glow, .ld-logo, .ld-bar, .ld-text, .ld-pop { animation: none; }
          .ld-bar { transform: scaleY(0.7); }
          .ld-root.ld-leaving { animation: none; }
        }
      `}</style>
    </div>
  );
};

// Ensures the loader is shown for at least LOADER.minMs while auth becomes ready
function useDelayedAuth() {
  const auth = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), LOADER.minMs);
    return () => clearTimeout(timer);
  }, []);

  return {
    ...auth,
    ready: auth.ready && minTimeElapsed,
  };
}

// loading -> finishing ("All set", fade) -> done (page appears)
type Phase = "loading" | "finishing" | "done";

function useLoaderPhase(ready: boolean): Phase {
  const [phase, setPhase] = useState<Phase>("loading");

  useEffect(() => {
    if (!ready) return;
    setPhase("finishing");
    const id = window.setTimeout(() => setPhase("done"), LOADER.exitMs);
    return () => window.clearTimeout(id);
  }, [ready]);

  return phase;
}

export function RequireAuth() {
  const { user, ready } = useDelayedAuth();
  const phase = useLoaderPhase(ready);
  if (phase !== "done") return <Loading finishing={phase === "finishing"} />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export function PublicOnly() {
  const { user, ready } = useDelayedAuth();
  const phase = useLoaderPhase(ready);
  if (phase !== "done") return <Loading finishing={phase === "finishing"} />;
  return user ? (
    <Navigate to="/overview" replace />
  ) : (
    <Outlet />
  );
}
