import React, { useEffect, useRef, useState } from "https://esm.sh/react@18.3.1";

const h = React.createElement;

const REPO_URL = "https://github.com/Ash310u/github-readme-stats";
const REPO_STARS_API = "/api/repo/stars";
const STAR_INTRO_PEAK = 79000;
const STAR_RUSH_END = 99;
const STAR_CRAWL_END = 100;
const STAR_FRAME_BUDGET_MS = 16;

function formatStarLabel(value) {
  return Number(value).toLocaleString("en-US");
}

function GitHubMarkIcon() {
  return h(
    "svg",
    {
      className: "nav-github-svg",
      viewBox: "0 0 16 16",
      width: 16,
      height: 16,
      "aria-hidden": true
    },
    h("path", {
      d: "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
    })
  );
}

function getReverseExponentialDelay(step) {
  const minDelay = 2;
  const maxDelay = 165;
  const growth = Math.exp(step / 95) - 1;
  const ceiling = Math.exp(6) - 1;
  return minDelay + ((maxDelay - minDelay) * growth) / ceiling;
}

function runReverseExponentialCount({ start, end, onValue, onComplete, loopRef }) {
  let current = start;
  let step = 0;

  function tick() {
    onValue(current);

    if (current >= end) {
      onComplete();
      return;
    }

    current += 1;
    step += 1;
    const timerId = window.setTimeout(tick, getReverseExponentialDelay(step));
    loopRef.timerIds.push(timerId);
  }

  tick();
}

function runSteadyCount({ start, end, delayMs, onValue, onComplete, loopRef }) {
  let current = start;

  function tick() {
    onValue(current);

    if (current >= end) {
      onComplete();
      return;
    }

    current += 1;
    const timerId = window.setTimeout(tick, delayMs);
    loopRef.timerIds.push(timerId);
  }

  tick();
}

function runBurstCount({ start, end, onValue, onComplete, loopRef }) {
  let current = start;
  const startedAt = performance.now();
  const durationMs = 320;

  function frame(now) {
    const progress = Math.min((now - startedAt) / durationMs, 1);
    const eased = progress ** 0.35;
    const next = Math.round(start + (end - start) * eased);

    while (current < next) {
      current += 1;
    }

    onValue(current);

    if (progress >= 1) {
      onValue(end);
      onComplete();
      return;
    }

    const frameId = window.requestAnimationFrame(frame);
    loopRef.rafIds.push(frameId);
  }

  const frameId = window.requestAnimationFrame(frame);
  loopRef.rafIds.push(frameId);
}

export const creator = {
  name: "Ash310u",
  handle: "ash310u",
  avatar: "https://github.com/Ash310u.png",
  bio: [
    "Building isn't something I started doing—it's something I've always been drawn to.",
    "At 12, I was already curious about how businesses worked, how startups were created, and what happened behind the scenes of the products people used every day.",
    "Since then, one belief has stayed the same: if I don't know how something works, I'll figure it out. That mindset has led me to learn, build, experiment, and ship ideas that started as simple questions."
  ],
  links: [
    { label: "GitHub", href: "https://github.com/Ash310u", icon: "github" },
    { label: "Twitter / X", href: "https://x.com/Ash310u", icon: "x" },
    { label: "Email", href: "mailto:hello@ash310u.dev", icon: "mail" }
  ]
};

export function usePath() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function navigate(to) {
    if (to === path) return;
    window.history.pushState({}, "", to);
    setPath(to);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return [path, navigate];
}

function GitHubStarButton() {
  const [stars, setStars] = useState(null);
  const [label, setLabel] = useState("…");
  const [phase, setPhase] = useState("loading");
  const loopRef = useRef({ timerIds: [], rafIds: [], timeoutIds: [] });

  function clearRunLoop() {
    loopRef.current.timerIds.forEach((timerId) => window.clearTimeout(timerId));
    loopRef.current.rafIds.forEach((frameId) => window.cancelAnimationFrame(frameId));
    loopRef.current.timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    loopRef.current = { timerIds: [], rafIds: [], timeoutIds: [] };
  }

  function schedule(delay, callback) {
    const timeoutId = window.setTimeout(callback, delay);
    loopRef.current.timeoutIds.push(timeoutId);
    return timeoutId;
  }

  useEffect(() => () => clearRunLoop(), []);

  function playIntro(real) {
    clearRunLoop();
    setPhase("intro-rush");
    setLabel("0");

    runReverseExponentialCount({
      start: 0,
      end: STAR_RUSH_END,
      loopRef: loopRef.current,
      onValue: (value) => setLabel(formatStarLabel(value)),
      onComplete: () => {
        setPhase("intro-crawl");

        runSteadyCount({
          start: STAR_RUSH_END,
          end: STAR_CRAWL_END,
          delayMs: 105,
          loopRef: loopRef.current,
          onValue: (value) => setLabel(formatStarLabel(value)),
          onComplete: () => {
            setPhase("intro-charge");

            schedule(360, () => {
              setPhase("intro-blowup");

              runBurstCount({
                start: STAR_CRAWL_END,
                end: STAR_INTRO_PEAK,
                loopRef: loopRef.current,
                onValue: (value) => setLabel(formatStarLabel(value)),
                onComplete: () => {
                  setLabel(formatStarLabel(STAR_INTRO_PEAK));

                  schedule(180, () => {
                    setPhase("intro-pop");
                    setLabel("");

                    schedule(35, () => {
                      setLabel(formatStarLabel(real));

                      schedule(320, () => {
                        setPhase("idle");
                      });
                    });
                  });
                }
              });
            });
          }
        });
      }
    });
  }

  useEffect(() => {
    let cancelled = false;

    fetch(REPO_STARS_API)
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;

        const count = Number(data.stars);
        const real = Number.isFinite(count) ? count : 0;
        setStars(real);

        playIntro(real);
      })
      .catch(() => {
        if (cancelled) return;
        setStars(0);
        setPhase("idle");
        setLabel("?");
      });

    return () => {
      cancelled = true;
      clearRunLoop();
    };
  }, []);

  function handleClick(event) {
    event.preventDefault();
    window.open(REPO_URL, "_blank", "noopener,noreferrer");
  }

  return h(
    "a",
    {
      href: REPO_URL,
      className: ["nav-star-btn", phase !== "idle" && phase !== "loading" ? `nav-star-btn--${phase}` : ""]
        .filter(Boolean)
        .join(" "),
      target: "_blank",
      rel: "noopener noreferrer",
      "aria-label": stars === null ? "View repository on GitHub" : `GitHub repository with ${stars} stars`,
      onClick: handleClick
    },
    h("span", { className: "nav-star-mark" }, h(GitHubMarkIcon)),
    h(
      "span",
      { className: "nav-star-count-wrap" },
      h("span", { className: "nav-star-count", "aria-live": "polite" }, label),
      phase === "intro-blowup" && h("span", { className: "nav-star-burst", "aria-hidden": true })
    )
  );
}

function NavLink({ href, label, active, onNavigate }) {
  return h(
    "a",
    {
      href,
      className: active ? "nav-link active" : "nav-link",
      onClick: (event) => {
        if (href.startsWith("/") && !href.startsWith("//")) {
          event.preventDefault();
          onNavigate(href);
        }
      }
    },
    label
  );
}

export function SiteNav({ path, onNavigate }) {
  return h(
    "header",
    { className: "site-nav" },
    h(
      "a",
      {
        href: "/",
        className: "site-brand",
        onClick: (event) => {
          event.preventDefault();
          onNavigate("/");
        }
      },
      "github-stats"
    ),
    h(
      "nav",
      { className: "site-nav-links", "aria-label": "Main" },
      h(NavLink, { href: "/", label: "builder", active: path === "/", onNavigate }),
      h(NavLink, { href: "/about", label: "about", active: path === "/about", onNavigate }),
      h(GitHubStarButton)
    )
  );
}

export function SiteFooter() {
  return h(
    "footer",
    { className: "site-footer" },
    h(
      "p",
      null,
      "made with ",
      h("span", { className: "heart", "aria-hidden": true }, "♥"),
      " by ",
      h(
        "a",
        { href: "https://github.com/Ash310u", target: "_blank", rel: "noreferrer" },
        "@ash310u"
      )
    ),
    h("a", { href: "/", className: "footer-link" }, "builder")
  );
}

function SocialLink({ link }) {
  return h(
    "a",
    {
      href: link.href,
      className: "social-link",
      target: "_blank",
      rel: "noreferrer"
    },
    h("span", null, link.label),
    h("span", { className: "external", "aria-hidden": true }, "↗")
  );
}

export function AboutPage({ onNavigate }) {
  return h(
    "div",
    { className: "about-page" },
    h(
      "section",
      { className: "about-hero" },
      h("p", { className: "eyebrow" }, "the builder"),
      h("h1", null, creator.name),
      h(
        "div",
        { className: "profile-block" },
        h("img", {
          className: "profile-avatar",
          src: creator.avatar,
          alt: `${creator.name} profile`,
          width: 120,
          height: 120
        }),
        h(
          "div",
          { className: "profile-copy" },
          h("h2", null, creator.name),
          h("p", { className: "profile-handle" }, `@${creator.handle}`),
          creator.bio.map((paragraph, index) => h("p", { key: index, className: "profile-bio" }, paragraph)),
          h(
            "div",
            { className: "social-links" },
            creator.links.map((link) => h(SocialLink, { key: link.label, link }))
          )
        )
      )
    ),
    h(
      "section",
      { className: "cta-section" },
      h("p", { className: "cta-star", "aria-hidden": true }, "✦"),
      h("h2", null, "Ready to build your card?"),
      h(
        "p",
        { className: "cta-copy" },
        "Pick your stats, arrange the layout, and copy the Markdown snippet straight into your README."
      ),
      h(
        "button",
        {
          type: "button",
          className: "cta-button",
          onClick: () => onNavigate("/")
        },
        "Open the builder",
        h("span", { "aria-hidden": true }, " →")
      )
    ),
    h(SiteFooter)
  );
}
