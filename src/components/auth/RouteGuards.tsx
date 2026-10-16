import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Check, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/roja-logo.png";

const HEADLINE = "Preparing your console";

const STEPS = [
  "Verifying your session",
  "Loading your workspace",
  "Syncing marketplace data",
];

const STEP_MS = 700;

const Loading = () => {
  // steps tick off one by one; the last one keeps spinning until the page is ready
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= STEPS.length - 1) return;
    const id = window.setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => window.clearTimeout(id);
  }, [step]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className="ld-root relative grid min-h-screen place-items-center overflow-hidden bg-white text-zinc-900"
    >
      {/* faint dotted grid, fading out toward the edges */}
      <div className="ld-grid pointer-events-none absolute inset-0" />
      {/* ambient glow */}
      <div className="ld-glow pointer-events-none absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="relative z-10 flex flex-col items-center px-6">
        {/* Logo inside a progress ring that fills while loading */}
        <div className="relative grid size-28 place-items-center">
          <svg
            viewBox="0 0 112 112"
            className="absolute inset-0 -rotate-90"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="ld-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
            </defs>
            <circle
              cx="56"
              cy="56"
              r="52"
              fill="none"
              stroke="#f4f4f5"
              strokeWidth="3"
            />
            <circle
              className="ld-arc"
              cx="56"
              cy="56"
              r="52"
              fill="none"
              stroke="url(#ld-grad)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="327"
            />
          </svg>
          <img
            src={logo}
            alt=""
            className="ld-logo relative h-11 w-auto max-w-[64px] object-contain"
          />
        </div>

        {/* Headline: letters come into focus one by one, then a shimmer sweeps across */}
        <h1
          aria-label={HEADLINE}
          className="ld-shimmer mt-9 flex text-2xl font-semibold tracking-tight"
        >
          {HEADLINE.split("").map((ch, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="ld-letter inline-block whitespace-pre"
              style={{ animationDelay: `${150 + i * 40}ms` }}
            >
              {ch}
            </span>
          ))}
          <span
            aria-hidden="true"
            className="ld-dots ml-0.5 inline-block w-6 text-left"
          />
        </h1>

        {/* Live checklist */}
        <ul className="mt-7 w-64 space-y-3">
          {STEPS.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li
                key={label}
                className={`ld-step flex items-center gap-3 text-sm transition-colors duration-300 ${
                  done
                    ? "text-zinc-400"
                    : active
                      ? "text-zinc-900"
                      : "text-zinc-300"
                }`}
                style={{ animationDelay: `${600 + i * 120}ms` }}
              >
                <span className="grid size-5 shrink-0 place-items-center">
                  {done ? (
                    <span className="ld-pop grid size-5 place-items-center rounded-full bg-emerald-500 text-white">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  ) : active ? (
                    <span className="ld-spin size-4 rounded-full border-2 border-emerald-500 border-t-transparent" />
                  ) : (
                    <span className="size-1.5 rounded-full bg-zinc-200" />
                  )}
                </span>
                <span className={active ? "font-medium" : ""}>{label}</span>
              </li>
            );
          })}
        </ul>

        {/* Trust note */}
        <p className="mt-10 flex items-center gap-1.5 text-xs text-zinc-400">
          <Lock className="size-3" />
          Secure connection
        </p>
      </div>

      <style>{`
        @keyframes ld-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ld-breathe {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.06); }
        }
        /* ring: quick fill to 90%, then a slow creep so it never looks stuck */
        @keyframes ld-fill  { from { stroke-dashoffset: 327; } to { stroke-dashoffset: 33; } }
        @keyframes ld-creep { from { stroke-dashoffset: 33; }  to { stroke-dashoffset: 7; } }
        @keyframes ld-letter-in {
          from { opacity: 0; transform: translateY(10px); filter: blur(6px); }
          to   { opacity: 1; transform: translateY(0);    filter: blur(0); }
        }
        @keyframes ld-sweep {
          from { background-position: 200% 0; }
          to   { background-position: -200% 0; }
        }
        @keyframes ld-dots {
          0%   { content: ""; }
          25%  { content: "."; }
          50%  { content: ".."; }
          75%  { content: "..."; }
        }
        @keyframes ld-step-in {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes ld-pop {
          0%   { transform: scale(0.4); }
          70%  { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        @keyframes ld-spin { to { transform: rotate(360deg); } }

        .ld-root { animation: ld-fade-in 400ms ease-out both; }
        .ld-grid {
          background-image: radial-gradient(#d4d4d8 1px, transparent 1px);
          background-size: 24px 24px;
          opacity: 0.55;
          -webkit-mask-image: radial-gradient(circle at center, #000 0%, transparent 60%);
                  mask-image: radial-gradient(circle at center, #000 0%, transparent 60%);
        }
        .ld-glow { animation: ld-breathe 3.2s ease-in-out infinite; }
        .ld-logo { animation: ld-breathe 2.6s ease-in-out infinite; }
        .ld-arc {
          stroke-dashoffset: 327;
          animation:
            ld-fill 2s cubic-bezier(.3,.7,.2,1) forwards,
            ld-creep 25s 2s linear forwards;
        }

        .ld-letter { animation: ld-letter-in 550ms cubic-bezier(.2,.8,.2,1) both; }
        .ld-shimmer {
          color: transparent;
          background-image: linear-gradient(100deg, #18181b 35%, #059669 50%, #18181b 65%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
                  background-clip: text;
          animation: ld-sweep 2.6s 1.2s linear infinite;
        }
        .ld-dots::after {
          content: "";
          animation: ld-dots 1.4s steps(1, end) infinite;
          -webkit-text-fill-color: #059669;
        }

        .ld-step { animation: ld-step-in 400ms ease-out both; }
        .ld-pop  { animation: ld-pop 300ms ease-out both; }
        .ld-spin { animation: ld-spin 700ms linear infinite; }

        @media (prefers-reduced-motion: reduce) {
          .ld-glow, .ld-logo, .ld-letter, .ld-shimmer,
          .ld-step, .ld-pop, .ld-spin, .ld-dots::after { animation: none; }
          .ld-arc { animation: none; stroke-dashoffset: 33; }
          .ld-shimmer { color: #18181b; background: none; }
          .ld-dots::after { content: "..."; }
        }
      `}</style>
    </div>
  );
};

// Ensures the loader is shown for at least 2 seconds while auth becomes ready
function useDelayedAuth() {
  const auth = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return {
    ...auth,
    ready: auth.ready && minTimeElapsed,
  };
}

export function RequireAuth() {
  const { user, ready } = useDelayedAuth();
  if (!ready) return <Loading />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export function PublicOnly() {
  const { user, ready } = useDelayedAuth();
  if (!ready) return <Loading />;
  return user ? (
    <Navigate to="/catalog/product-categories" replace />
  ) : (
    <Outlet />
  );
}
