"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "../lib/firebase.config";
import { ref as dbRef, onValue } from "firebase/database";
import {
  UserCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowDown,
} from "lucide-react";

// ─── Intersection-observer based fade hook ────────────────────────────────────
function useFadeIn(options = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, ...options },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
}

// ─── Section wrapper ────────────────────────────────────────────────────────
function FadeSection({
  children,
  className = "",
  delay = 0,
  direction = "up",
}) {
  const [ref, visible] = useFadeIn();
  const translateMap = {
    up: "translateY(40px)",
    down: "translateY(-40px)",
    left: "translateX(40px)",
    right: "translateX(-40px)",
  };
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translate(0,0)"
          : translateMap[direction] || "translateY(40px)",
        transition: `opacity 0.8s ease ${delay}ms, transform 0.8s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Divider ────────────────────────────────────────────────────────────────
function LineDivider({ color = "cyan" }) {
  const c =
    color === "gold" ? "rgba(251,191,36,0.35)" : "rgba(34,211,238,0.35)";
  return (
    <div
      className="w-20 h-px mx-auto my-8"
      style={{
        background: `linear-gradient(90deg, transparent, ${c}, transparent)`,
      }}
    />
  );
}

// ─── Auto-scroll hook ────────────────────────────────────────────────────────
// Slowly glides to each section in sequence with generous reading pauses.
// Any user interaction (wheel / touch / click / key) immediately cancels it.
function useAutoScroll() {
  useEffect(() => {
    let cancelled = false;
    const timers = [];
    let rafId = null;

    const cancel = () => {
      if (cancelled) return;
      cancelled = true;
      timers.forEach(clearTimeout);
      if (rafId) cancelAnimationFrame(rafId);
      ["wheel", "touchstart", "mousedown", "keydown"].forEach((e) =>
        window.removeEventListener(e, cancel, true),
      );
    };

    ["wheel", "touchstart", "mousedown", "keydown"].forEach((e) =>
      window.addEventListener(e, cancel, { passive: true, capture: true }),
    );

    // Custom slow-glide: eases scroll from current position to target over `duration` ms
    const slowGlideTo = (targetY, duration = 3200) => {
      return new Promise((resolve) => {
        if (cancelled) {
          resolve();
          return;
        }
        const startY = window.scrollY;
        const diff = targetY - startY;
        const startTime = performance.now();

        const easeInOutCubic = (t) =>
          t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const step = (now) => {
          if (cancelled) {
            resolve();
            return;
          }
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          window.scrollTo(0, startY + diff * easeInOutCubic(progress));
          if (progress < 1) {
            rafId = requestAnimationFrame(step);
          } else {
            resolve();
          }
        };
        rafId = requestAnimationFrame(step);
      });
    };

    // Sequence: [section id, reading pause before scrolling to NEXT (ms), scroll duration (ms)]
    const sequence = [
      { id: null, pause: 5000, scrollDur: 0 }, // hero – wait only
      { id: "tribute-panel", pause: 9000, scrollDur: 3200 },
      { id: "section-2", pause: 11000, scrollDur: 3600 },
      { id: "carousel-section", pause: 14000, scrollDur: 3600 },
      { id: "section-5", pause: 10000, scrollDur: 3200 },
      { id: "section-6", pause: 0, scrollDur: 3200 },
    ];

    // Build the chain with accumulated timeouts
    let accumulated = 0;
    sequence.forEach(({ id, pause, scrollDur }, i) => {
      accumulated += i === 0 ? 5000 : sequence[i - 1].pause; // wait after previous section
      if (i === 0) return; // skip hero – nothing to scroll to

      const t = setTimeout(async () => {
        if (cancelled) return;
        const el = document.getElementById(id);
        if (!el) return;
        const targetY = el.getBoundingClientRect().top + window.scrollY;
        await slowGlideTo(targetY, scrollDur);
      }, accumulated);
      timers.push(t);
    });

    return () => cancel();
  }, []);
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function TributePage() {
  // Firebase wishes
  const [wishes, setWishes] = useState([]);
  useEffect(() => {
    const wishesRef = dbRef(db, "wishes");
    const unsub = onValue(wishesRef, (snap) => {
      const data = snap.val();
      if (data) {
        const arr = Object.keys(data).map((k) => ({ id: k, ...data[k] }));
        arr.sort((a, b) => b.timestamp - a.timestamp);
        setWishes(arr);
      } else {
        setWishes([]);
      }
    });
    return () => unsub();
  }, []);

  // Hero entrance state
  const [heroVisible, setHeroVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  // Auto-scroll
  useAutoScroll([]);

  // Carousel
  const [activeIdx, setActiveIdx] = useState(0);
  const autoRef = useRef(null);

  const startAuto = useCallback(() => {
    clearInterval(autoRef.current);
    if (wishes.length > 1) {
      autoRef.current = setInterval(() => {
        setActiveIdx((i) => (i + 1) % wishes.length);
      }, 12000);
    }
  }, [wishes.length]);

  useEffect(() => {
    setActiveIdx(0);
    startAuto();
    return () => clearInterval(autoRef.current);
  }, [wishes, startAuto]);

  const goPrev = () => {
    clearInterval(autoRef.current);
    setActiveIdx((i) => (i - 1 + wishes.length) % wishes.length);
    startAuto();
  };
  const goNext = () => {
    clearInterval(autoRef.current);
    setActiveIdx((i) => (i + 1) % wishes.length);
    startAuto();
  };

  // CSS helpers
  const cardBase = {
    background: "linear-gradient(145deg, #071428 0%, #0b1e38 100%)",
    border: "1px solid rgba(34,211,238,0.12)",
    boxShadow:
      "0 12px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(34,211,238,0.05)",
  };
  const accentLine = (color = "cyan") => ({
    background: `linear-gradient(90deg, transparent, ${color === "gold" ? "rgba(251,191,36,0.4)" : "rgba(34,211,238,0.4)"}, transparent)`,
  });

  return (
    <div
      className="bg-[#020b18] text-sky-50 min-h-screen overflow-x-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Fixed background ─────────────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none select-none">
        {/* Navy bloom */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(14,42,94,0.6) 0%, transparent 100%)",
          }}
        />
        {/* Star field */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.14,
            backgroundImage:
              "radial-gradient(circle at center, #38bdf8 1px, transparent 1.5px), radial-gradient(circle at center, #64748b 0.5px, transparent 1px)",
            backgroundSize: "90px 90px, 50px 50px",
            backgroundPosition: "0 0, 25px 35px",
          }}
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1 — HERO
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center z-10 px-6 py-20">
        {/* Glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: 480,
            height: 480,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%)",
            filter: "blur(60px)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -58%)",
            opacity: heroVisible ? 1 : 0,
            transition: "opacity 1.4s ease",
          }}
        />

        {/* Avatar */}
        <div
          className="relative w-28 h-28 rounded-full flex items-center justify-center mb-8 z-10"
          style={{
            background: "linear-gradient(135deg, #071428, #0e2247)",
            border: "1.5px solid rgba(34,211,238,0.22)",
            boxShadow: heroVisible ? "0 0 40px rgba(34,211,238,0.18)" : "none",
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(20px)",
            transition:
              "opacity 1s ease 0.2s, transform 1s ease 0.2s, box-shadow 1.2s ease 0.2s",
          }}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "linear-gradient(to bottom, rgba(34,211,238,0.07) 0%, transparent 70%)",
            }}
          />
          <UserCircle2 strokeWidth={1.2} className="w-14 h-14 text-slate-300" />

          {/* Orbiting sparkles */}
          {[
            [-28, -8],
            [26, -12],
            [16, 28],
          ].map(([x, y], i) => (
            <Sparkles
              key={i}
              className="absolute w-3 h-3 text-cyan-300/60"
              style={{
                left: "50%",
                top: "50%",
                transform: `translate(${x}px, ${y}px)`,
                opacity: heroVisible ? 0.7 : 0,
                transition: `opacity 1s ease ${0.8 + i * 0.15}s`,
              }}
            />
          ))}
        </div>

        {/* Headline */}
        <h1
          className="text-center text-5xl md:text-7xl font-bold leading-tight mb-6 z-10"
          style={{
            fontFamily: "Georgia, serif",
            background:
              "linear-gradient(180deg, #f0f9ff 0%, #bae6fd 60%, #7dd3fc 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 20px rgba(125,211,252,0.18))",
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible
              ? "translateY(0) scale(1)"
              : "translateY(30px) scale(0.97)",
            transition: "opacity 1s ease 0.4s, transform 1s ease 0.4s",
          }}
        >
          Happy Birthday,
          <br />
          Mr. Ezekiel!
        </h1>

        {/* Subtitle */}
        <p
          className="text-lg md:text-xl text-sky-300/70 tracking-[0.2em] uppercase z-10"
          style={{
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 1s ease 0.65s, transform 1s ease 0.65s",
          }}
        >
          Manager,{" "}
          <span className="text-cyan-400 font-semibold tracking-wider">
            Glint Technologies
          </span>
        </p>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-10 flex flex-col items-center gap-2 text-slate-500 text-xs tracking-widest uppercase"
          style={{
            opacity: heroVisible ? 0.7 : 0,
            transition: "opacity 1.2s ease 1.2s",
          }}
        >
          <span>Scroll</span>
          <ArrowDown className="w-4 h-4 animate-bounce" />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1.5 — TRIBUTE QUOTE
      ══════════════════════════════════════════════════════════════════ */}
      <section
        id="tribute-panel"
        className="relative z-10 py-28 px-6 flex items-center justify-center"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 30% at 50% 50%, rgba(14,42,94,0.35) 0%, transparent 100%)",
          }}
        />

        <FadeSection
          className="relative max-w-3xl w-full text-center rounded-3xl px-10 py-14 md:px-16 md:py-18 overflow-hidden"
          delay={0}
        >
          <div style={{ ...cardBase }}>
            {/* Top accent */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={accentLine("cyan")}
            />

            <div className="p-10 md:p-14">
              <Sparkles className="w-6 h-6 text-cyan-400/40 mx-auto mb-8" />
              <p
                className="text-xl md:text-2xl text-sky-100/80 leading-relaxed font-light"
                style={{ fontFamily: "Georgia, serif" }}
              >
                &ldquo;
                <em className="text-cyan-300 not-italic">
                  Today we celebrate not only another year of your life,
                </em>{" "}
                but also the incredible leadership, wisdom, and positivity you
                bring to everyone around you at Glint Technologies. Your
                dedication to excellence, your passion for growth, and the way
                you uplift those around you make you far more than just a
                manager — you are a mentor, a guide, and an inspiration.&rdquo;
              </p>
            </div>

            {/* Bottom accent */}
            <div
              className="absolute bottom-0 left-0 right-0 h-px"
              style={accentLine("cyan")}
            />
          </div>
        </FadeSection>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2 — LEADER & MENTOR CARDS
      ══════════════════════════════════════════════════════════════════ */}
      <section id="section-2" className="relative z-10 py-28 px-6">
        {/* Ambient orbs — purely decorative, no animations */}
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(14,60,130,0.2) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-80 h-80 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(8,40,90,0.25) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />

        <div className="max-w-4xl mx-auto space-y-10">
          {/* Card 1 */}
          <FadeSection delay={0} direction="left">
            <div
              className="relative rounded-3xl overflow-hidden p-10 md:p-14 group"
              style={cardBase}
            >
              <div
                className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={accentLine("cyan")}
              />
              <div className="flex items-start gap-5 mb-6">
                <div
                  className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center mt-1"
                  style={{
                    background: "rgba(34,211,238,0.08)",
                    border: "1px solid rgba(34,211,238,0.18)",
                  }}
                >
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                </div>
                <h2
                  className="text-3xl md:text-4xl font-semibold text-sky-50"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  The Mark of a Leader
                </h2>
              </div>
              <p className="text-lg md:text-xl text-slate-300/90 leading-relaxed font-light">
                A great manager does more than assign tasks or oversee projects.
                A great manager builds people. Mr. Ezekiel, your leadership
                style reflects patience, wisdom, and a genuine desire to see
                others succeed. You lead with clarity, fairness, and integrity,
                creating an environment where everyone feels valued and
                motivated to give their best.
              </p>
            </div>
          </FadeSection>

          {/* Card 2 */}
          <FadeSection delay={120} direction="right">
            <div
              className="relative rounded-3xl overflow-hidden p-10 md:p-14 md:ml-12 group"
              style={{ ...cardBase, border: "1px solid rgba(251,191,36,0.09)" }}
            >
              <div
                className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={accentLine("gold")}
              />
              <div className="flex items-start gap-5 mb-6">
                <div
                  className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center mt-1"
                  style={{
                    background: "rgba(251,191,36,0.08)",
                    border: "1px solid rgba(251,191,36,0.18)",
                  }}
                >
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <h2
                  className="text-3xl md:text-4xl font-semibold text-sky-50"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  Guidance &amp; Growth
                </h2>
              </div>
              <p className="text-lg md:text-xl text-slate-300/90 leading-relaxed font-light">
                One of the most admirable qualities about you is how supportive
                you are to your team. You take the time to listen, offer
                guidance, and encourage new ideas. Whether it&rsquo;s providing
                direction during a challenging project or offering words of
                motivation when someone needs them most, your support has made a
                lasting difference.
              </p>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 3 — BIRTHDAY WISHES CAROUSEL
      ══════════════════════════════════════════════════════════════════ */}
      <section id="carousel-section" className="relative z-10 py-28 px-6">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(7,20,40,0.55) 0%, transparent 100%)",
          }}
        />

        <FadeSection className="max-w-4xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.35em] text-cyan-400/60 uppercase mb-3">
              From the team
            </p>
            <h2
              className="text-4xl md:text-5xl font-semibold text-sky-50"
              style={{ fontFamily: "Georgia, serif" }}
            >
              The Voice of the Team
            </h2>
            <LineDivider />
          </div>

          {/* Carousel */}
          {wishes.length === 0 ? (
            /* Empty state */
            <div className="rounded-3xl p-14 text-center" style={cardBase}>
              <Sparkles className="w-10 h-10 text-cyan-400/30 mx-auto mb-6 animate-pulse" />
              <p className="text-slate-400 text-lg font-light italic mb-6">
                No birthday wishes yet. Be the first!
              </p>
              <a
                href="/upload"
                className="inline-block px-6 py-2.5 rounded-full text-sm text-cyan-400 transition-all duration-300 hover:bg-cyan-400/10"
                style={{ border: "1px solid rgba(34,211,238,0.25)" }}
              >
                Leave a wish →
              </a>
            </div>
          ) : (
            <div className="relative">
              {/* Card shell — height is driven by the active wish */}
              <div
                className="relative rounded-3xl overflow-hidden"
                style={cardBase}
              >
                {/* Top accent */}
                <div
                  className="absolute top-0 left-0 right-0 h-px z-10"
                  style={accentLine("cyan")}
                />

                {/* All cards stacked; only the active one is visible.
                    The active card is position:relative so it drives height.
                    Inactive cards sit absolute on top but are invisible. */}
                {wishes.map((wish, i) => (
                  <div
                    key={wish.id || i}
                    className="flex flex-col items-center justify-center text-center px-10 py-14 md:px-16"
                    style={{
                      position: i === activeIdx ? "relative" : "absolute",
                      inset: i === activeIdx ? "auto" : 0,
                      opacity: i === activeIdx ? 1 : 0,
                      transform:
                        i === activeIdx ? "translateY(0)" : "translateY(12px)",
                      transition: "opacity 0.6s ease, transform 0.6s ease",
                      pointerEvents: i === activeIdx ? "auto" : "none",
                      zIndex: i === activeIdx ? 1 : 0,
                    }}
                  >
                    <div
                      className="w-12 h-px mb-8"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent, rgba(34,211,238,0.4), transparent)",
                      }}
                    />
                    <p
                      className="text-xl md:text-2xl text-sky-100/90 font-light italic leading-relaxed mb-10"
                      style={{ fontFamily: "Georgia, serif", maxWidth: 560 }}
                    >
                      &ldquo;{wish.message}&rdquo;
                    </p>
                    <div>
                      <p className="text-cyan-400 font-semibold text-lg tracking-wide mb-1">
                        {wish.name}
                      </p>
                      <span
                        className="text-xs tracking-widest uppercase text-slate-500 px-3 py-1 rounded-full"
                        style={{
                          border: "1px solid rgba(148,163,184,0.12)",
                          background: "rgba(15,37,69,0.5)",
                        }}
                      >
                        Guest
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Controls row */}
              {wishes.length > 1 && (
                <div className="flex items-center justify-between mt-8 px-2">
                  {/* Prev */}
                  <button
                    onClick={goPrev}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-cyan-400 transition-colors duration-200"
                    style={{
                      border: "1px solid rgba(34,211,238,0.12)",
                      background: "rgba(7,20,40,0.6)",
                    }}
                    aria-label="Previous wish"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* Dot indicators */}
                  <div className="flex items-center gap-2">
                    {wishes.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          clearInterval(autoRef.current);
                          setActiveIdx(i);
                          startAuto();
                        }}
                        className="rounded-full transition-all duration-300"
                        style={{
                          width: i === activeIdx ? 20 : 8,
                          height: 8,
                          background:
                            i === activeIdx
                              ? "rgba(34,211,238,0.8)"
                              : "rgba(34,211,238,0.2)",
                        }}
                        aria-label={`Go to wish ${i + 1}`}
                      />
                    ))}
                  </div>

                  {/* Next */}
                  <button
                    onClick={goNext}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-cyan-400 transition-colors duration-200"
                    style={{
                      border: "1px solid rgba(34,211,238,0.12)",
                      background: "rgba(7,20,40,0.6)",
                    }}
                    aria-label="Next wish"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Wish count */}
              <p className="text-center text-xs text-slate-600 tracking-widest uppercase mt-4">
                {activeIdx + 1} / {wishes.length}
              </p>
            </div>
          )}
        </FadeSection>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 4 — THE GLINT VISION
      ══════════════════════════════════════════════════════════════════ */}
      <section id="section-5" className="relative z-10 py-28 px-6">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(14,42,94,0.3) 0%, transparent 100%)",
          }}
        />

        <FadeSection className="max-w-4xl mx-auto">
          <div
            className="relative rounded-3xl overflow-hidden text-center px-10 py-16 md:px-20 md:py-20"
            style={cardBase}
          >
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={accentLine("gold")}
            />

            {/* Corner bloom */}
            <div
              className="absolute top-0 right-0 w-56 h-56 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(34,211,238,0.07) 0%, transparent 70%)",
                filter: "blur(30px)",
                transform: "translate(30%, -30%)",
              }}
            />

            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-8"
              style={{
                background: "rgba(251,191,36,0.08)",
                border: "1px solid rgba(251,191,36,0.2)",
              }}
            >
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>

            <h2
              className="text-4xl md:text-5xl font-semibold text-sky-50 mb-6"
              style={{ fontFamily: "Georgia, serif" }}
            >
              The Glint Vision
            </h2>
            <LineDivider />

            <p className="text-xl md:text-2xl text-slate-300/90 leading-relaxed font-light mb-6">
              Under your leadership, Glint Technologies continues to grow
              stronger. Your vision, discipline, and commitment to excellence
              set a standard that motivates everyone around you.
            </p>
            <p className="text-xl md:text-2xl text-slate-300/90 leading-relaxed font-light">
              You have helped create a culture of professionalism, innovation,
              and teamwork that makes working here both rewarding and inspiring.
            </p>

            <div
              className="absolute bottom-0 left-0 right-0 h-px"
              style={accentLine("cyan")}
            />
          </div>
        </FadeSection>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 5 — CLOSING
      ══════════════════════════════════════════════════════════════════ */}
      <section id="section-6" className="relative z-10 py-32 md:py-48 px-6">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(14,42,94,0.4) 0%, transparent 100%)",
          }}
        />

        <FadeSection className="max-w-3xl mx-auto text-center">
          <p className="text-xs tracking-[0.35em] text-cyan-400/55 uppercase mb-6">
            A message from the team
          </p>

          <h2
            className="text-5xl md:text-7xl font-light mb-10 leading-tight"
            style={{
              fontFamily: "Georgia, serif",
              background: "linear-gradient(180deg, #f0f9ff 0%, #7dd3fc 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            With Deep
            <br />
            Gratitude
          </h2>

          <LineDivider />

          <p className="text-xl md:text-2xl text-slate-300/90 leading-relaxed font-light mb-14">
            Today we want you to know how much your efforts are appreciated.
            Leadership can sometimes be a demanding responsibility, but you
            carry it with grace, humility, and dedication. As you celebrate this
            new year of life, we wish you continued success, good health, and
            endless happiness. Thank you for being the supportive leader and
            inspiring manager that you are.
          </p>

          <LineDivider color="gold" />

          <p
            className="text-4xl md:text-6xl font-light text-sky-50 mt-10 leading-snug"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Happy Birthday,{" "}
            <span
              className="font-semibold italic"
              style={{
                background: "linear-gradient(90deg, #fcd34d, #f59e0b)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Mr. Ezekiel.
            </span>
          </p>

          <p className="text-slate-500 mt-6 tracking-[0.28em] text-xs uppercase">
            From all of us at Glint Technologies
          </p>
        </FadeSection>
      </section>
    </div>
  );
}
