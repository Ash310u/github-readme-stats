import React, { useEffect, useState } from "https://esm.sh/react@18.3.1";

const h = React.createElement;

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
      h(
        "a",
        {
          href: "https://github.com/Ash310u/github-readme-stats",
          className: "nav-cta",
          target: "_blank",
          rel: "noreferrer"
        },
        "GitHub",
        h("span", { "aria-hidden": true }, " →")
      )
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
