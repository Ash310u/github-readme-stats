import React, { useMemo, useState } from "https://esm.sh/react@18.3.1";
import { createRoot } from "https://esm.sh/react-dom@18.3.1/client";

const h = React.createElement;

const CUSTOM_TEXT_MAX_LENGTH = 60;

const availableWidgets = [
  { id: "stats", label: "summary", short: "totals" },
  { id: "heatmap", label: "heatmap", short: "contributions" },
  { id: "weekly", label: "weekly", short: "bars" },
  { id: "chart", label: "streaks", short: "contribution stats" },
  { id: "languages", label: "languages", short: "top repos" },
  { id: "repos", label: "repos", short: "repository stats" },
  { id: "activity", label: "activity", short: "commits, PRs, issues" }
];

const widgetMetricFields = {
  stats: [
    { key: "stars", label: "stars" },
    { key: "commits", label: "commits" },
    { key: "prs", label: "pull requests" },
    { key: "issues", label: "issues" },
    { key: "contributed", label: "contributed to" }
  ],
  chart: [
    { key: "total", label: "total contributions" },
    { key: "current_streak", label: "current streak" },
    { key: "longest_streak", label: "longest streak" }
  ],
  repos: [
    { key: "public_repos", label: "public repos" },
    { key: "forks", label: "forks" },
    { key: "stars", label: "stars" },
    { key: "followers", label: "followers" },
    { key: "following", label: "following" }
  ],
  activity: [
    { key: "commits", label: "commits" },
    { key: "prs", label: "pull requests" },
    { key: "issues", label: "issues" }
  ]
};

const themes = [
  { id: "github_dark", label: "dark" },
  { id: "github_light", label: "light" }
];

const defaultCardCopy = {
  title: "",
  subtitle: "",
  badge: "github-stats"
};

function moveItem(items, fromIndex, toIndex) {
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

function clampCustomText(value) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .slice(0, CUSTOM_TEXT_MAX_LENGTH);
}

function buildMetricsParam(metrics = {}) {
  return Object.entries(metrics)
    .filter(([, label]) => label.trim())
    .map(([key, label]) => `${key}:${clampCustomText(label).trim()}`)
    .join(",");
}

function buildCardUrl({ username, widgets, theme, from, to, cardCopy, widgetCopy }) {
  const params = new URLSearchParams({
    username: username.trim(),
    theme,
    widgets: widgets.join(",")
  });

  if (from) params.set("from", from);
  if (to) params.set("to", to);

  if (cardCopy.title.trim()) params.set("title", clampCustomText(cardCopy.title).trim());
  if (cardCopy.subtitle.trim()) params.set("subtitle", clampCustomText(cardCopy.subtitle).trim());
  if (cardCopy.badge.trim() && cardCopy.badge.trim() !== defaultCardCopy.badge) {
    params.set("badge", clampCustomText(cardCopy.badge).trim());
  }

  for (const widgetId of widgets) {
    const copy = widgetCopy[widgetId] || {};
    if (copy.title?.trim()) params.set(`label_${widgetId}`, clampCustomText(copy.title).trim());
    if (copy.detail?.trim()) params.set(`detail_${widgetId}`, clampCustomText(copy.detail).trim());

    const metrics = buildMetricsParam(copy.metrics);
    if (metrics) params.set(`metrics_${widgetId}`, metrics);
  }

  return `${window.location.origin}/api/stats/custom?${params.toString()}`;
}

function CustomTextField({ label, value, placeholder, onChange, hint }) {
  return h(
    "label",
    { className: "mini-field" },
    h("span", null, label),
    h("input", {
      value,
      maxLength: CUSTOM_TEXT_MAX_LENGTH,
      placeholder,
      spellCheck: "false",
      onChange: (event) => onChange(clampCustomText(event.target.value))
    }),
    hint && h("small", null, hint)
  );
}

function BuilderApp() {
  const [username, setUsername] = useState("Ash310u");
  const [theme, setTheme] = useState("github_dark");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [widgets, setWidgets] = useState(["stats", "heatmap", "weekly"]);
  const [cardCopy, setCardCopy] = useState({ ...defaultCardCopy });
  const [widgetCopy, setWidgetCopy] = useState({});
  const [expandedWidget, setExpandedWidget] = useState(null);
  const [dragged, setDragged] = useState(null);
  const [copied, setCopied] = useState("");
  const [toast, setToast] = useState(null);

  const selectedWidgets = useMemo(
    () => widgets.map((id) => availableWidgets.find((widget) => widget.id === id)).filter(Boolean),
    [widgets]
  );

  const cardUrl = useMemo(
    () => buildCardUrl({ username, widgets, theme, from, to, cardCopy, widgetCopy }),
    [username, widgets, theme, from, to, cardCopy, widgetCopy]
  );
  const markdown = `![github stats](${cardUrl})`;

  const previewSubtitle =
    cardCopy.subtitle.trim() || `@${username.trim() || "username"} · custom GitHub profile card`;
  const previewTitle = cardCopy.title.trim() || username.trim() || "username";

  function updateCardCopy(key, value) {
    setCardCopy((current) => ({ ...current, [key]: value }));
  }

  function updateWidgetCopy(widgetId, patch) {
    setWidgetCopy((current) => ({
      ...current,
      [widgetId]: {
        title: "",
        detail: "",
        metrics: {},
        ...current[widgetId],
        ...patch
      }
    }));
  }

  function updateWidgetMetric(widgetId, metricKey, value) {
    setWidgetCopy((current) => {
      const existing = current[widgetId] || { title: "", detail: "", metrics: {} };
      return {
        ...current,
        [widgetId]: {
          ...existing,
          metrics: {
            ...existing.metrics,
            [metricKey]: clampCustomText(value)
          }
        }
      };
    });
  }

  function addWidget(id) {
    if (!widgets.includes(id)) {
      setWidgets([...widgets, id]);
      setExpandedWidget(id);
    }
  }

  function removeWidget(id, showUndo = true) {
    const removedIndex = widgets.indexOf(id);
    const next = widgets.filter((widget) => widget !== id);
    setWidgets(next);

    if (expandedWidget === id) {
      setExpandedWidget(null);
    }

    if (showUndo && removedIndex >= 0) {
      const removedWidget = availableWidgets.find((widget) => widget.id === id);
      setToast({ id, index: removedIndex, label: removedWidget?.label || id });
      window.setTimeout(() => {
        setToast((current) => (current?.id === id ? null : current));
      }, 5000);
    }
  }

  function toggleWidget(id) {
    if (widgets.includes(id)) {
      removeWidget(id);
      return;
    }

    addWidget(id);
  }

  function undoRemove() {
    if (!toast) {
      return;
    }

    setWidgets((current) => {
      if (current.includes(toast.id)) {
        return current;
      }

      const next = [...current];
      next.splice(Math.min(toast.index, next.length), 0, toast.id);
      return next;
    });
    setToast(null);
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
        setExpandedWidget(id);
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

  function renderWidgetCustomizer(widget) {
    const copy = widgetCopy[widget.id] || { title: "", detail: "", metrics: {} };
    const metricFields = widgetMetricFields[widget.id] || [];
    const isExpanded = expandedWidget === widget.id;

    return h(
      "div",
      { className: "widget-customize" },
      h(
        "button",
        {
          type: "button",
          className: isExpanded ? "customize-toggle is-open" : "customize-toggle",
          onClick: () => setExpandedWidget(isExpanded ? null : widget.id)
        },
        isExpanded ? "hide labels" : "edit labels"
      ),
      isExpanded &&
        h(
          "div",
          { className: "customize-panel" },
          h(
            "div",
            { className: "customize-grid" },
            h(CustomTextField, {
              label: "section title",
              value: copy.title,
              placeholder: widget.label,
              hint: `${copy.title.length}/${CUSTOM_TEXT_MAX_LENGTH}`,
              onChange: (value) => updateWidgetCopy(widget.id, { title: value })
            }),
            h(CustomTextField, {
              label: "section detail",
              value: copy.detail,
              placeholder: "optional right-side note",
              hint: `${copy.detail.length}/${CUSTOM_TEXT_MAX_LENGTH}`,
              onChange: (value) => updateWidgetCopy(widget.id, { detail: value })
            })
          ),
          metricFields.length > 0 &&
            h(
              "div",
              { className: "metric-grid" },
              h("p", { className: "metric-grid-title" }, "metric labels"),
              metricFields.map((field) =>
                h(CustomTextField, {
                  key: field.key,
                  label: field.label,
                  value: copy.metrics?.[field.key] || "",
                  placeholder: field.label,
                  hint: `${(copy.metrics?.[field.key] || "").length}/${CUSTOM_TEXT_MAX_LENGTH}`,
                  onChange: (value) => updateWidgetMetric(widget.id, field.key, value)
                })
              )
            )
        )
    );
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
        h("p", { className: "eyebrow" }, "github stats builder"),
        h("h1", null, "custom profile card")
      ),
      h(
        "label",
        { className: "field" },
        h("span", null, "username"),
        h("input", {
          value: username,
          onChange: (event) => setUsername(event.target.value),
          placeholder: "github username",
          spellCheck: "false"
        })
      ),
      h(
        "div",
        { className: "segmented", role: "group", "aria-label": "theme" },
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
        h("span", null, "from"),
        h("input", {
          type: "date",
          value: from,
          onChange: (event) => setFrom(event.target.value)
        })
      ),
      h(
        "label",
        { className: "field compact" },
        h("span", null, "to"),
        h("input", {
          type: "date",
          value: to,
          onChange: (event) => setTo(event.target.value)
        })
      )
    ),
    h(
      "section",
      { className: "card-copy-bar" },
      h("h2", null, "card text"),
      h(
        "div",
        { className: "card-copy-grid" },
        h(CustomTextField, {
          label: "title",
          value: cardCopy.title,
          placeholder: "uses github display name",
          hint: `${cardCopy.title.length}/${CUSTOM_TEXT_MAX_LENGTH}`,
          onChange: (value) => updateCardCopy("title", value)
        }),
        h(CustomTextField, {
          label: "subtitle",
          value: cardCopy.subtitle,
          placeholder: `@${username || "username"} · custom GitHub profile card`,
          hint: `${cardCopy.subtitle.length}/${CUSTOM_TEXT_MAX_LENGTH}`,
          onChange: (value) => updateCardCopy("subtitle", value)
        }),
        h(CustomTextField, {
          label: "badge",
          value: cardCopy.badge,
          placeholder: defaultCardCopy.badge,
          hint: `${cardCopy.badge.length}/${CUSTOM_TEXT_MAX_LENGTH}`,
          onChange: (value) => updateCardCopy("badge", value)
        })
      )
    ),
    h(
      "section",
      { className: "workspace" },
      h(
        "aside",
        { className: "palette" },
        h("h2", null, "elements"),
        h(
          "div",
          { className: "palette-list" },
          availableWidgets.map((widget) =>
            h(
              "button",
              {
                key: widget.id,
                type: "button",
                className: widgets.includes(widget.id) ? "palette-item is-selected" : "palette-item",
                "aria-pressed": widgets.includes(widget.id),
                draggable: true,
                onClick: () => toggleWidget(widget.id),
                onDragStart: (event) => {
                  const value = `palette:${widget.id}`;
                  setDragged(value);
                  event.dataTransfer.setData("text/plain", value);
                },
                onDragEnd: () => setDragged(null)
              },
              h("span", { className: "selection-dot", "aria-hidden": true }),
              h("span", { className: "palette-copy" }, h("strong", null, widget.label), h("small", null, widget.short))
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
            h(
              "div",
              null,
              h("strong", null, previewTitle),
              h("span", null, previewSubtitle)
            ),
            h("code", null, `${selectedWidgets.length} elements`)
          ),
          h(
            "div",
            { className: "drop-stack" },
            selectedWidgets.length
              ? selectedWidgets.map((widget, index) =>
                  h(
                    "div",
                    {
                      key: widget.id,
                      className: expandedWidget === widget.id ? "drop-block is-expanded" : "drop-block"
                    },
                    h(
                      "div",
                      {
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
                      h("span", { className: "thread-line", "aria-hidden": true }),
                      h("span", { className: "grab", "aria-hidden": true }, "::"),
                      h(
                        "div",
                        { className: "drop-copy" },
                        h("strong", null, widgetCopy[widget.id]?.title?.trim() || widget.label),
                        h(
                          "small",
                          null,
                          widgetCopy[widget.id]?.detail?.trim() || widget.short
                        )
                      ),
                      h(
                        "button",
                        {
                          type: "button",
                          className: "icon-button",
                          "aria-label": `remove ${widget.label}`,
                          onClick: () => removeWidget(widget.id)
                        },
                        "x"
                      )
                    ),
                    renderWidgetCustomizer(widget)
                  )
                )
              : h("div", { className: "empty-canvas" }, "select elements from the left rail")
          )
        )
      ),
      h(
        "aside",
        { className: "output-panel" },
        h("h2", null, "preview"),
        username.trim()
          ? h("img", { className: "svg-preview", src: cardUrl, alt: "Custom GitHub stats card preview" })
          : h("div", { className: "empty-preview" }),
        h(
          "div",
          { className: "copy-grid" },
          h(
            "button",
            { type: "button", onClick: () => copy(cardUrl, "URL") },
            copied === "URL" ? "copied url" : "copy url"
          ),
          h(
            "button",
            { type: "button", onClick: () => copy(markdown, "Markdown") },
            copied === "Markdown" ? "copied markdown" : "copy markdown"
          )
        ),
        h("textarea", { readOnly: true, value: markdown, rows: 5 })
      ),
      toast &&
        h(
          "div",
          { className: "undo-toast", role: "status" },
          h("span", null, `${toast.label} removed`),
          h("button", { type: "button", onClick: undoRemove }, "undo")
        )
    )
  );
}

createRoot(document.getElementById("root")).render(h(BuilderApp));
