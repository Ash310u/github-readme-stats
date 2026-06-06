import React, { useMemo, useState } from "https://esm.sh/react@18.3.1";
import { createRoot } from "https://esm.sh/react-dom@18.3.1/client";

const h = React.createElement;

const availableWidgets = [
  { id: "stats", label: "Summary", short: "Totals" },
  { id: "heatmap", label: "Heatmap", short: "Contributions" },
  { id: "weekly", label: "Weekly", short: "Bars" },
  { id: "chart", label: "Streaks", short: "Contribution stats" },
  { id: "languages", label: "Languages", short: "Top repos" },
  { id: "repos", label: "Repos", short: "Repository stats" },
  { id: "activity", label: "Activity", short: "Commits, PRs, issues" }
];

const themes = [
  { id: "github_dark", label: "Dark" },
  { id: "github_light", label: "Light" }
];

function moveItem(items, fromIndex, toIndex) {
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

function buildCardUrl({ username, widgets, theme, from, to }) {
  const params = new URLSearchParams({
    username: username.trim(),
    theme,
    widgets: widgets.join(",")
  });

  if (from) params.set("from", from);
  if (to) params.set("to", to);

  return `${window.location.origin}/api/stats/custom?${params.toString()}`;
}

function BuilderApp() {
  const [username, setUsername] = useState("Ash310u");
  const [theme, setTheme] = useState("github_dark");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [widgets, setWidgets] = useState(["stats", "heatmap", "weekly"]);
  const [dragged, setDragged] = useState(null);
  const [copied, setCopied] = useState("");

  const selectedWidgets = useMemo(
    () => widgets.map((id) => availableWidgets.find((widget) => widget.id === id)).filter(Boolean),
    [widgets]
  );

  const cardUrl = useMemo(
    () => buildCardUrl({ username, widgets, theme, from, to }),
    [username, widgets, theme, from, to]
  );
  const markdown = `![GitHub Stats](${cardUrl})`;

  function addWidget(id) {
    if (!widgets.includes(id)) {
      setWidgets([...widgets, id]);
    }
  }

  function removeWidget(id) {
    const next = widgets.filter((widget) => widget !== id);
    setWidgets(next.length ? next : ["stats"]);
  }

  function copy(value, label) {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(label);
      window.setTimeout(() => setCopied(""), 1600);
    });
  }

  function onDropCanvas(event, targetIndex = widgets.length) {
    event.preventDefault();
    const source = dragged || event.dataTransfer.getData("text/plain");

    if (!source) {
      return;
    }

    if (source.startsWith("palette:")) {
      const id = source.replace("palette:", "");
      if (!widgets.includes(id)) {
        const next = [...widgets];
        next.splice(targetIndex, 0, id);
        setWidgets(next);
      }
      return;
    }

    if (source.startsWith("canvas:")) {
      const id = source.replace("canvas:", "");
      const fromIndex = widgets.indexOf(id);
      if (fromIndex >= 0) {
        const adjustedIndex = fromIndex < targetIndex ? targetIndex - 1 : targetIndex;
        setWidgets(moveItem(widgets, fromIndex, adjustedIndex));
      }
    }
  }

  return h(
    "main",
    { className: "app-shell" },
    h(
      "section",
      { className: "builder-bar" },
      h(
        "div",
        { className: "brand-block" },
        h("p", { className: "eyebrow" }, "GitHub Stats Builder"),
        h("h1", null, "Custom Profile Card")
      ),
      h(
        "label",
        { className: "field" },
        h("span", null, "Username"),
        h("input", {
          value: username,
          onChange: (event) => setUsername(event.target.value),
          placeholder: "github username",
          spellCheck: "false"
        })
      ),
      h(
        "div",
        { className: "segmented", role: "group", "aria-label": "Theme" },
        themes.map((item) =>
          h(
            "button",
            {
              key: item.id,
              type: "button",
              className: theme === item.id ? "is-active" : "",
              onClick: () => setTheme(item.id)
            },
            item.label
          )
        )
      ),
      h(
        "label",
        { className: "field compact" },
        h("span", null, "From"),
        h("input", {
          type: "date",
          value: from,
          onChange: (event) => setFrom(event.target.value)
        })
      ),
      h(
        "label",
        { className: "field compact" },
        h("span", null, "To"),
        h("input", {
          type: "date",
          value: to,
          onChange: (event) => setTo(event.target.value)
        })
      )
    ),
    h(
      "section",
      { className: "workspace" },
      h(
        "aside",
        { className: "palette" },
        h("h2", null, "Elements"),
        h(
          "div",
          { className: "palette-list" },
          availableWidgets.map((widget) =>
            h(
              "button",
              {
                key: widget.id,
                type: "button",
                className: widgets.includes(widget.id) ? "palette-item is-used" : "palette-item",
                draggable: true,
                onClick: () => addWidget(widget.id),
                onDragStart: (event) => {
                  const value = `palette:${widget.id}`;
                  setDragged(value);
                  event.dataTransfer.setData("text/plain", value);
                },
                onDragEnd: () => setDragged(null)
              },
              h("span", null, widget.label),
              h("small", null, widget.short)
            )
          )
        )
      ),
      h(
        "section",
        { className: "canvas-zone" },
        h(
          "div",
          {
            className: `canvas ${theme === "github_light" ? "light" : ""}`,
            onDragOver: (event) => event.preventDefault(),
            onDrop: (event) => onDropCanvas(event)
          },
          h(
            "div",
            { className: "canvas-head" },
            h("div", null, h("strong", null, username || "username"), h("span", null, "custom card")),
            h("span", null, `${selectedWidgets.length} elements`)
          ),
          h(
            "div",
            { className: "drop-stack" },
            selectedWidgets.map((widget, index) =>
              h(
                "div",
                {
                  key: widget.id,
                  className: "drop-row",
                  draggable: true,
                  onDragStart: (event) => {
                    const value = `canvas:${widget.id}`;
                    setDragged(value);
                    event.dataTransfer.setData("text/plain", value);
                  },
                  onDragEnd: () => setDragged(null),
                  onDragOver: (event) => event.preventDefault(),
                  onDrop: (event) => onDropCanvas(event, index)
                },
                h("span", { className: "grab" }, "::"),
                h("div", null, h("strong", null, widget.label), h("small", null, widget.short)),
                h(
                  "button",
                  {
                    type: "button",
                    className: "icon-button",
                    "aria-label": `Remove ${widget.label}`,
                    onClick: () => removeWidget(widget.id)
                  },
                  "x"
                )
              )
            )
          )
        )
      ),
      h(
        "aside",
        { className: "output-panel" },
        h("h2", null, "Preview"),
        username.trim()
          ? h("img", { className: "svg-preview", src: cardUrl, alt: "Custom GitHub stats card preview" })
          : h("div", { className: "empty-preview" }),
        h(
          "div",
          { className: "copy-grid" },
          h(
            "button",
            { type: "button", onClick: () => copy(cardUrl, "URL") },
            copied === "URL" ? "Copied URL" : "Copy URL"
          ),
          h(
            "button",
            { type: "button", onClick: () => copy(markdown, "Markdown") },
            copied === "Markdown" ? "Copied Markdown" : "Copy Markdown"
          )
        ),
        h("textarea", { readOnly: true, value: markdown, rows: 5 })
      )
    )
  );
}

createRoot(document.getElementById("root")).render(h(BuilderApp));
