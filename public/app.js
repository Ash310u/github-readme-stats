import React, { Fragment, useMemo, useState } from "https://esm.sh/react@18.3.1";
import { createRoot } from "https://esm.sh/react-dom@18.3.1/client";
import { AboutPage, SiteFooter, SiteNav, usePath } from "./site.js";

const h = React.createElement;

const CUSTOM_TEXT_MAX_LENGTH = 60;

const elementGroups = [
  {
    id: "summary",
    label: "Summary",
    elements: [
      { id: "stars", label: "Stars", desc: "Total stars earned" },
      { id: "commits", label: "Commits", desc: "Commit count" },
      { id: "prs", label: "Pull requests", desc: "PRs opened" },
      { id: "issues", label: "Issues", desc: "Issues opened" },
      { id: "contributed", label: "Contributed to", desc: "Repos contributed" }
    ]
  },
  {
    id: "streaks",
    label: "Streaks",
    elements: [
      { id: "total_contributions", label: "Total contributions", desc: "In date range" },
      { id: "current_streak", label: "Current streak", desc: "Active days" },
      { id: "longest_streak", label: "Longest streak", desc: "Best run" }
    ]
  },
  {
    id: "repos",
    label: "Repositories",
    elements: [
      { id: "public_repos", label: "Public repos", desc: "Repository count" },
      { id: "forks", label: "Forks", desc: "Total forks" },
      { id: "repo_stars", label: "Repo stars", desc: "Stars on repos" },
      { id: "followers", label: "Followers", desc: "Follower count" },
      { id: "following", label: "Following", desc: "Following count" }
    ]
  },
  {
    id: "charts",
    label: "Charts",
    elements: [
      { id: "heatmap", label: "Heatmap", desc: "Contribution grid" },
      { id: "weekly", label: "Weekly chart", desc: "Weekly bars" },
      { id: "languages", label: "Languages", desc: "Top languages" },
      { id: "activity", label: "Activity", desc: "Commits, PRs, issues" }
    ]
  }
];

const catalog = elementGroups.flatMap((group) =>
  group.elements.map((element) => ({ ...element, group: group.label }))
);

const themes = [
  { id: "github_dark", label: "Dark" },
  { id: "github_light", label: "Light" }
];

const defaultCardCopy = { title: "", subtitle: "", badge: "github-stats" };
const defaultElements = ["stars", "commits", "prs", "issues", "contributed", "heatmap", "weekly"];

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

function buildCardUrl({ username, elements, theme, from, to, cardCopy }) {
  const params = new URLSearchParams({
    username: username.trim(),
    theme,
    elements: elements.join(",")
  });

  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (cardCopy.title.trim()) params.set("title", clampCustomText(cardCopy.title).trim());
  if (cardCopy.subtitle.trim()) params.set("subtitle", clampCustomText(cardCopy.subtitle).trim());
  if (cardCopy.badge.trim() && cardCopy.badge.trim() !== defaultCardCopy.badge) {
    params.set("badge", clampCustomText(cardCopy.badge).trim());
  }

  return `${window.location.origin}/api/stats/custom?${params.toString()}`;
}

function insertAtIndex(list, id, targetIndex) {
  const next = list.filter((item) => item !== id);
  const index = Math.max(0, Math.min(targetIndex, next.length));
  next.splice(index, 0, id);
  return next;
}

function Input({ label, value, placeholder, onChange, type = "text", maxLength }) {
  return h(
    "label",
    { className: "input-field" },
    h("span", { className: "input-label" }, label),
    h("input", {
      type,
      value,
      maxLength,
      placeholder,
      spellCheck: "false",
      onChange: (event) => onChange(event.target.value)
    })
  );
}

function BuilderApp() {
  const [username, setUsername] = useState("Ash310u");
  const [theme, setTheme] = useState("github_dark");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [elements, setElements] = useState([...defaultElements]);
  const [cardCopy, setCardCopy] = useState({ ...defaultCardCopy });
  const [query, setQuery] = useState("");
  const [showDates, setShowDates] = useState(false);
  const [showHeaderEdit, setShowHeaderEdit] = useState(false);
  const [draggedId, setDraggedId] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);
  const [copied, setCopied] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [toast, setToast] = useState(null);

  const ordered = useMemo(
    () => elements.map((id) => catalog.find((item) => item.id === id)).filter(Boolean),
    [elements]
  );

  const filteredGroups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return elementGroups;

    return elementGroups
      .map((group) => ({
        ...group,
        elements: group.elements.filter(
          (element) =>
            element.label.toLowerCase().includes(needle) ||
            element.desc.toLowerCase().includes(needle) ||
            group.label.toLowerCase().includes(needle)
        )
      }))
      .filter((group) => group.elements.length > 0);
  }, [query]);

  const cardUrl = useMemo(
    () => (elements.length && username.trim() ? buildCardUrl({ username, elements, theme, from, to, cardCopy }) : ""),
    [username, elements, theme, from, to, cardCopy]
  );
  const markdown = cardUrl ? `![github stats](${cardUrl})` : "";

  function updateCardCopy(key, value) {
    setCardCopy((current) => ({ ...current, [key]: clampCustomText(value) }));
  }

  function toggleElement(id) {
    if (elements.includes(id)) {
      removeElement(id);
      return;
    }
    setElements([...elements, id]);
  }

  function removeElement(id, showUndo = true) {
    const removedIndex = elements.indexOf(id);
    setElements(elements.filter((item) => item !== id));

    if (showUndo && removedIndex >= 0) {
      const label = catalog.find((item) => item.id === id)?.label || id;
      setToast({ id, index: removedIndex, label });
      window.setTimeout(() => setToast((current) => (current?.id === id ? null : current)), 4500);
    }
  }

  function undoRemove() {
    if (!toast) return;
    setElements((current) => {
      if (current.includes(toast.id)) return current;
      const next = [...current];
      next.splice(Math.min(toast.index, next.length), 0, toast.id);
      return next;
    });
    setToast(null);
  }

  function endDrag() {
    setDraggedId(null);
    setDropIndex(null);
  }

  function onDragStart(event, id) {
    setDraggedId(id);
    setDropIndex(null);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
  }

  function onRowDragOver(event, index) {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const before = event.clientY < rect.top + rect.height / 2;
    setDropIndex(before ? index : index + 1);
  }

  function onListDragOver(event) {
    if (!ordered.length) return;
    event.preventDefault();
    setDropIndex(ordered.length);
  }

  function onDrop(event, targetIndex) {
    event.preventDefault();
    const id = draggedId || event.dataTransfer.getData("text/plain");
    if (!id) {
      endDrag();
      return;
    }
    const index = targetIndex ?? dropIndex ?? ordered.length;
    setElements((current) => insertAtIndex(current, id, index));
    endDrag();
  }

  function copy(value, label) {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      setCopied(label);
      window.setTimeout(() => setCopied(""), 1800);
    });
  }

  return h(
    "div",
    { className: "dashboard" },
    h(
      "section",
      { className: "dashboard-toolbar card" },
      h(Input, {
        label: "GitHub username",
        value: username,
        placeholder: "e.g. Ash310u",
        onChange: setUsername
      }),
      h(
        "div",
        { className: "input-field" },
        h("span", { className: "input-label" }, "Theme"),
        h(
          "div",
          { className: "theme-switch", role: "group", "aria-label": "Theme" },
          themes.map((item) =>
            h(
              "button",
              {
                key: item.id,
                type: "button",
                className: theme === item.id ? "active" : "",
                onClick: () => setTheme(item.id)
              },
              item.label
            )
          )
        )
      ),
      h(
        "div",
        { className: "toolbar-actions" },
        h(
          "button",
          { type: "button", className: "ghost-btn", onClick: () => setShowDates((open) => !open) },
          showDates ? "Hide dates" : "Date range"
        ),
        h(
          "button",
          { type: "button", className: "ghost-btn", onClick: () => setShowHeaderEdit((open) => !open) },
          showHeaderEdit ? "Hide header text" : "Edit header"
        ),
        h(
          "button",
          { type: "button", className: "ghost-btn", onClick: () => setElements([...defaultElements]) },
          "Reset card"
        )
      ),
      showDates &&
        h(
          "div",
          { className: "toolbar-extra" },
          h(Input, { label: "From", type: "date", value: from, onChange: setFrom }),
          h(Input, { label: "To", type: "date", value: to, onChange: setTo })
        ),
      showHeaderEdit &&
        h(
          "div",
          { className: "toolbar-extra" },
          h(Input, {
            label: "Title",
            value: cardCopy.title,
            maxLength: CUSTOM_TEXT_MAX_LENGTH,
            placeholder: "Uses GitHub display name",
            onChange: (value) => updateCardCopy("title", value)
          }),
          h(Input, {
            label: "Subtitle",
            value: cardCopy.subtitle,
            maxLength: CUSTOM_TEXT_MAX_LENGTH,
            placeholder: "Custom subtitle",
            onChange: (value) => updateCardCopy("subtitle", value)
          }),
          h(Input, {
            label: "Badge",
            value: cardCopy.badge,
            maxLength: CUSTOM_TEXT_MAX_LENGTH,
            placeholder: defaultCardCopy.badge,
            onChange: (value) => updateCardCopy("badge", value)
          })
        )
    ),
    h(
      "div",
      { className: "dashboard-grid" },
      h(
        "section",
        { className: "dashboard-panel card" },
        h(
          "div",
          { className: "panel-head" },
          h("h2", null, "Order"),
          h("span", { className: "badge" }, `${ordered.length}`)
        ),
        h(
          "div",
          {
            className: draggedId ? "panel-body order-list dragging" : "panel-body order-list",
            onDragOver: onListDragOver,
            onDrop: (event) => onDrop(event, ordered.length)
          },
            ordered.length
              ? ordered.map((item, index) =>
                  h(
                    Fragment,
                    { key: item.id },
                    dropIndex === index &&
                      h("div", { className: "drop-indicator", "aria-hidden": true }),
                    h(
                      "div",
                      {
                        className: draggedId === item.id ? "order-row is-dragging" : "order-row",
                        onDragOver: (event) => onRowDragOver(event, index),
                        onDrop: (event) => onDrop(event, dropIndex ?? index)
                      },
                      h(
                        "button",
                        {
                          type: "button",
                          className: "drag-btn",
                          "aria-label": `Drag ${item.label}`,
                          draggable: true,
                          onDragStart: (event) => onDragStart(event, item.id),
                          onDragEnd: endDrag
                        },
                        h("svg", { viewBox: "0 0 20 20", width: 16, height: 16, "aria-hidden": true }, h("path", { d: "M7 4h2v2H7V4zm4 0h2v2h-2V4zM7 8h2v2H7V8zm4 0h2v2h-2V8zM7 12h2v2H7v-2zm4 0h2v2h-2v-2z", fill: "currentColor" }))
                      ),
                      h("span", { className: "order-rank" }, index + 1),
                      h(
                        "div",
                        { className: "order-meta" },
                        h("strong", null, item.label),
                        h("span", null, item.group)
                      ),
                      h(
                        "button",
                        {
                          type: "button",
                          className: "icon-btn danger",
                          "aria-label": `Remove ${item.label}`,
                          onClick: () => removeElement(item.id)
                        },
                        "×"
                      )
                    )
                  )
                )
              : h(
                  "div",
                  {
                    className: "empty",
                    onDragOver: (event) => {
                      event.preventDefault();
                      setDropIndex(0);
                    },
                    onDrop: (event) => onDrop(event, 0)
                  },
                  h("p", null, "No items yet. Add stats or charts below.")
                ),
            dropIndex === ordered.length && ordered.length > 0 && h("div", { className: "drop-indicator", "aria-hidden": true })
        )
      ),
      h(
        "section",
        { className: "dashboard-panel card" },
        h(
          "div",
          { className: "panel-head" },
          h("h2", null, "Elements"),
          h("input", {
            className: "search",
            type: "search",
            value: query,
            placeholder: "Search…",
            onChange: (event) => setQuery(event.target.value)
          })
        ),
        h(
          "div",
          { className: "panel-body" },
          filteredGroups.length
            ? filteredGroups.map((group) =>
                h(
                  "div",
                  { key: group.id, className: "catalog-group" },
                  h("h3", null, group.label),
                  h(
                    "div",
                    { className: "catalog-grid" },
                    group.elements.map((element) => {
                      const active = elements.includes(element.id);
                      return h(
                        "button",
                        {
                          key: element.id,
                          type: "button",
                          className: active ? "catalog-card active" : "catalog-card",
                          onClick: () => toggleElement(element.id),
                          onDragStart: (event) => onDragStart(event, element.id),
                          onDragEnd: endDrag,
                          draggable: true
                        },
                        h("span", { className: "catalog-check" }, active ? "✓" : "+"),
                        h("strong", null, element.label),
                        h("small", null, element.desc)
                      );
                    })
                  )
                )
              )
            : h("div", { className: "empty compact" }, h("p", null, "No elements match your search."))
        )
      ),
      h(
        "aside",
        { className: "dashboard-panel card preview-panel" },
        h("div", { className: "panel-head" }, h("h2", null, "Preview"), h("span", { className: "badge live" }, "Live")),
        h(
          "div",
          { className: "panel-body preview-body" },
          h(
            "div",
            { className: `preview-stage ${theme === "github_light" ? "light" : ""}` },
            !username.trim()
              ? h("div", { className: "empty compact" }, h("p", null, "Enter a username to preview."))
              : !elements.length
                ? h("div", { className: "empty compact" }, h("p", null, "Add at least one element."))
                : previewError
                  ? h("div", { className: "empty compact error" }, h("p", null, "Could not load preview."))
                  : h("img", {
                      key: cardUrl,
                      className: "preview-img",
                      src: cardUrl,
                      alt: "GitHub stats card preview",
                      onLoad: () => setPreviewError(false),
                      onError: () => setPreviewError(true)
                    })
          ),
          h(
            "button",
            {
              type: "button",
              className: "primary-btn",
              disabled: !markdown,
              onClick: () => copy(markdown, "markdown")
            },
            copied === "markdown" ? "Copied!" : "Copy for README"
          ),
          h(
            "button",
            {
              type: "button",
              className: "secondary-btn",
              disabled: !cardUrl,
              onClick: () => copy(cardUrl, "url")
            },
            copied === "url" ? "URL copied" : "Copy image URL"
          ),
          cardUrl &&
            h("details", { className: "url-details" }, h("summary", null, "View URL"), h("code", null, cardUrl))
        )
      )
    ),
    toast &&
      h(
        "div",
        { className: "toast", role: "status" },
        h("span", null, `${toast.label} removed`),
        h("button", { type: "button", onClick: undoRemove }, "Undo")
      )
  );
}

function App() {
  const [path, navigate] = usePath();

  return h(
    "div",
    { className: path === "/about" ? "site site--about" : "site site--builder" },
    h(SiteNav, { path, onNavigate: navigate }),
    path === "/about" ? h(AboutPage, { onNavigate: navigate }) : h(BuilderApp)
  );
}

createRoot(document.getElementById("root")).render(h(App));
