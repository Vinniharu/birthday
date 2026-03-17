"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "../../lib/firebase.config";
import { ref as dbRef, onValue } from "firebase/database";
import {
    ArrowLeft,
    Pause,
    StickyNote,
    Loader2,
} from "lucide-react";
import Link from "next/link";
import "./fulldisplay.css";

// ── Theme palette — cycles per slide ─────────────────────────────────
const THEMES = [
    {
        bg: "bg-gradient-to-br from-[#1a1207] via-[#3d2b14] to-[#1a1207]",
        fill: "bg-gradient-to-r from-amber-300 to-amber-500",
        accent: "#fcd34d",
    },
    {
        bg: "bg-gradient-to-br from-[#1a0a10] via-[#3d1a2b] to-[#1a0a10]",
        fill: "bg-gradient-to-r from-rose-400 to-rose-500",
        accent: "#fb7185",
    },
    {
        bg: "bg-gradient-to-br from-[#0a1a0e] via-[#1a3d20] to-[#0a1a0e]",
        fill: "bg-gradient-to-r from-emerald-300 to-emerald-400",
        accent: "#6ee7b7",
    },
    {
        bg: "bg-gradient-to-br from-[#0a101a] via-[#1a2b3d] to-[#0a101a]",
        fill: "bg-gradient-to-r from-sky-300 to-sky-400",
        accent: "#7dd3fc",
    },
    {
        bg: "bg-gradient-to-br from-[#120a1a] via-[#2b1a3d] to-[#120a1a]",
        fill: "bg-gradient-to-r from-violet-300 to-violet-400",
        accent: "#c4b5fd",
    },
    {
        bg: "bg-gradient-to-br from-[#1a0f07] via-[#3d2414] to-[#1a0f07]",
        fill: "bg-gradient-to-r from-orange-300 to-orange-400",
        accent: "#fdba74",
    },
];

const SLIDE_DURATION = 20000;
const TICK_INTERVAL = 50;

export default function FullDisplayPage() {
    const [wishes, setWishes] = useState([]);
    const [activeIdx, setActiveIdx] = useState(0);
    const [progress, setProgress] = useState(0);
    const [paused, setPaused] = useState(false);
    const [transitioning, setTransitioning] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const elapsedRef = useRef(0);
    const timerRef = useRef(null);
    const pausedRef = useRef(false);

    // ── Firebase subscription ──────────────────────────────────────────
    useEffect(() => {
        const wishesRef = dbRef(db, "wishes");
        const unsub = onValue(wishesRef, (snap) => {
            const data = snap.val();
            if (data) {
                const arr = Object.keys(data).map((k) => ({ id: k, ...data[k] }));
                arr.sort((a, b) => a.timestamp - b.timestamp);
                setWishes(arr);
            } else {
                setWishes([]);
            }
            setIsLoading(false);
        });
        return () => unsub();
    }, []);

    // ── Go to a specific slide ─────────────────────────────────────────
    const goToSlide = useCallback((idx) => {
        setTransitioning(true);
        setTimeout(() => {
            setActiveIdx(idx);
            setProgress(0);
            elapsedRef.current = 0;
            setTransitioning(false);
        }, 400);
    }, []);

    // ── Auto-advance timer ─────────────────────────────────────────────
    useEffect(() => {
        if (wishes.length === 0) return;

        timerRef.current = setInterval(() => {
            if (pausedRef.current) return;

            elapsedRef.current += TICK_INTERVAL;
            const pct = Math.min((elapsedRef.current / SLIDE_DURATION) * 100, 100);
            setProgress(pct);

            if (elapsedRef.current >= SLIDE_DURATION) {
                elapsedRef.current = 0;
                setProgress(0);
                setTransitioning(true);
                setTimeout(() => {
                    setActiveIdx((prev) => (prev + 1) % wishes.length);
                    setTransitioning(false);
                }, 400);
            }
        }, TICK_INTERVAL);

        return () => clearInterval(timerRef.current);
    }, [wishes.length]);

    // ── Pause / resume via hold ────────────────────────────────────────
    const handlePointerDown = useCallback(() => {
        pausedRef.current = true;
        setPaused(true);
    }, []);

    const handlePointerUp = useCallback(() => {
        pausedRef.current = false;
        setPaused(false);
    }, []);

    useEffect(() => {
        const release = () => {
            if (pausedRef.current) {
                pausedRef.current = false;
                setPaused(false);
            }
        };
        window.addEventListener("pointerup", release);
        window.addEventListener("pointercancel", release);
        window.addEventListener("blur", release);
        return () => {
            window.removeEventListener("pointerup", release);
            window.removeEventListener("pointercancel", release);
            window.removeEventListener("blur", release);
        };
    }, []);

    // ── Skip prev / next ───────────────────────────────────────────────
    const goPrev = useCallback(() => {
        elapsedRef.current = 0;
        setProgress(0);
        goToSlide((activeIdx - 1 + wishes.length) % wishes.length);
    }, [activeIdx, wishes.length, goToSlide]);

    const goNext = useCallback(() => {
        elapsedRef.current = 0;
        setProgress(0);
        goToSlide((activeIdx + 1) % wishes.length);
    }, [activeIdx, wishes.length, goToSlide]);

    // ── Dot navigation ─────────────────────────────────────────────────
    const jumpTo = useCallback(
        (idx) => {
            if (idx === activeIdx) return;
            elapsedRef.current = 0;
            setProgress(0);
            goToSlide(idx);
        },
        [activeIdx, goToSlide],
    );

    // ── Derived ────────────────────────────────────────────────────────
    const theme = THEMES[activeIdx % THEMES.length];
    const wish = wishes[activeIdx];

    return (
        <div
            className={`fixed inset-0 overflow-hidden font-serif transition-colors duration-1000 slide-bg ${theme.bg}`}
        >
            {/* ── Back link ─────────────────────────────────────────────── */}
            <Link
                href="/"
                className="fixed top-6 left-7 z-20 inline-flex items-center gap-1.5 font-sans text-[0.8rem] tracking-widest uppercase text-white/35 no-underline transition-colors duration-300 hover:text-white/70"
            >
                <ArrowLeft size={14} />
                Back
            </Link>

            {/* ── Slide counter ─────────────────────────────────────────── */}
            {wishes.length > 0 && (
                <div className="fixed top-6 right-7 z-20 font-sans text-[0.8rem] tracking-[0.15em] text-white/35">
                    {activeIdx + 1} / {wishes.length}
                </div>
            )}

            {/* ── Pause badge ───────────────────────────────────────────── */}
            <div
                className={`fixed top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-1.5 rounded-full font-sans text-[0.75rem] tracking-[0.12em] uppercase text-white/50 bg-white/[0.06] border border-white/[0.08] backdrop-blur-lg pointer-events-none transition-opacity duration-300 ${paused ? "opacity-100" : "opacity-0"
                    }`}
            >
                <Pause size={12} />
                Paused — release to continue
            </div>

            {/* ── Main content ──────────────────────────────────────────── */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center min-h-screen text-center gap-4">
                    <Loader2 size={48} className="text-white/30 animate-spin" />
                    <p className="font-sans text-[0.8rem] uppercase tracking-widest text-white/40 mt-2">
                        Loading wishes...
                    </p>
                </div>
            ) : wishes.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-screen text-center gap-4">
                    <StickyNote
                        size={56}
                        strokeWidth={1}
                        className="text-white/20"
                    />
                    <h2 className="font-serif text-3xl text-white/50">No wishes yet</h2>
                    <p className="text-base text-white/30">
                        Be the first to leave a birthday wish!
                    </p>
                    <Link
                        href="/upload"
                        className="mt-3 px-7 py-2.5 rounded-full text-sm font-sans text-white/60 border border-white/15 no-underline transition-all duration-300 hover:bg-white/[0.06] hover:border-white/30 hover:text-white/80"
                    >
                        Leave a wish →
                    </Link>
                </div>
            ) : (
                <div
                    className={`relative z-[1] flex flex-col items-center justify-center min-h-screen px-[120px] pt-[60px] pb-[100px] text-center select-none ${paused ? "cursor-pointer" : "cursor-default"
                        } ${transitioning ? "slide-out" : "slide-in"} max-sm:px-[60px]`}
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                    key={activeIdx}
                >
                    {/* Quote mark */}
                    <div
                        className="text-[5rem] leading-none opacity-15 -mb-5"
                        style={{ color: theme.accent }}
                    >
                        &ldquo;
                    </div>

                    {/* Message */}
                    <p className="text-[clamp(1.4rem,3.5vw,2.4rem)] leading-relaxed font-light max-w-[1200px] w-full text-white/[0.92] mb-10 tracking-[0.01em]">
                        {wish?.message}
                    </p>
                </div>
            )}

            {/* ── Navigation arrows (Left/Right) ───────────────────────── */}
            {wishes.length > 0 && (
                <>
                    <button
                        onClick={goPrev}
                        className="fixed left-7 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-md text-white/40 flex items-center justify-center cursor-pointer transition-all duration-300 hover:bg-white/[0.1] hover:border-white/20 hover:text-white/80 hover:scale-[1.05] active:scale-95 max-sm:left-3 max-sm:w-10 max-sm:h-10"
                        aria-label="Previous wish"
                    >
                        <ArrowLeft size={24} />
                    </button>

                    <button
                        onClick={goNext}
                        className="fixed right-7 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-md text-white/40 flex items-center justify-center cursor-pointer transition-all duration-300 hover:bg-white/[0.1] hover:border-white/20 hover:text-white/80 hover:scale-[1.05] active:scale-95 max-sm:right-3 max-sm:w-10 max-sm:h-10"
                        aria-label="Next wish"
                    >
                        <ArrowLeft size={24} className="rotate-180" />
                    </button>
                </>
            )}

            {/* ── Author Card (Top Right below counter) ────────────────── */}
            {wishes.length > 0 && (
                <div className="fixed right-7 top-[72px] z-20 max-sm:right-4 max-sm:top=[60px]">
                    <div className="px-5 py-3.5 rounded-2xl bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] text-right min-w-[140px] max-w-[240px] max-sm:px-4 max-sm:py-2.5 max-sm:min-w-[100px]">
                        <p className="font-sans text-[0.6rem] uppercase tracking-[0.2em] text-white/30 mb-1.5">
                            Wish from
                        </p>
                        <p
                            className="font-serif text-[1.1rem] font-semibold tracking-[0.05em] text-white/85 break-words max-sm:text-[0.9rem]"
                            style={{ color: theme.accent }}
                        >
                            {wish?.name}
                        </p>
                    </div>
                </div>
            )}

            {/* ── Progress bar ──────────────────────────────────────────── */}
            {wishes.length > 0 && (
                <>
                    {/* Glow */}
                    <div
                        className={`fixed bottom-0 left-0 h-10 z-[19] pointer-events-none blur-xl opacity-40 transition-[width] duration-100 ${theme.fill}`}
                        style={{ width: `${progress}%` }}
                    />
                    {/* Track */}
                    <div className="fixed bottom-0 left-0 right-0 h-[5px] z-20 bg-white/[0.06]">
                        <div
                            className={`h-full rounded-r-sm transition-[width] duration-100 ${theme.fill}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </>
            )}

            {/* ── Dot navigation ────────────────────────────────────────── */}
            {wishes.length > 1 && wishes.length <= 30 && (
                <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 max-sm:hidden">
                    {wishes.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => jumpTo(i)}
                            className={`rounded-full border-0 p-0 cursor-pointer transition-all duration-300 ${i === activeIdx
                                ? "w-[18px] h-2 rounded-sm bg-white/50"
                                : "w-1.5 h-1.5 bg-white/15 hover:bg-white/35"
                                }`}
                            aria-label={`Go to wish ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
