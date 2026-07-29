"use client";

import { useState, type ReactNode } from "react";

type Tab = { id: string; label: string };

export default function LegalTabs({
  tabs,
  panels,
  initialId,
}: {
  tabs: Tab[];
  panels: Record<string, ReactNode>;
  initialId?: string;
}) {
  const [active, setActive] = useState(initialId ?? tabs[0]?.id);

  return (
    <div>
      <nav
        aria-label="Sections"
        className="laku-rail mb-5 flex gap-1 overflow-x-auto border-b border-laku-line"
      >
        {tabs.map((tab) => {
          const current = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={`shrink-0 border-b-2 px-3 pb-3 text-sm transition-colors ${
                current
                  ? "border-laku-blue font-bold text-laku-blue"
                  : "border-transparent font-medium text-laku-muted hover:text-laku-ink"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
      <div>{panels[active]}</div>
    </div>
  );
}

/** Renders FAQ/policy bodies that use literal newlines or bullet lines. */
export function LegalBody({ children }: { children: string }) {
  const text = children.replace(/\\n/g, "\n");
  return <p className="whitespace-pre-line text-sm/6 text-laku-muted">{text}</p>;
}

export function LegalSection({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="mb-5 last:mb-0">
      <h3 className="mb-1.5 text-sm font-bold text-laku-ink">{title}</h3>
      <LegalBody>{body}</LegalBody>
    </div>
  );
}
