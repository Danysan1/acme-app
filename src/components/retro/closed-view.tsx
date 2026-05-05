"use client";

import { useEffect, useRef, useState } from "react";

type Card = {
  id: string;
  column: "well" | "improve" | "questions";
  text: string;
  voteCount: number;
};

type ActionItem = {
  id: string;
  title: string;
  ownerName: string;
};

type Participant = {
  id: string;
  displayName: string;
  email: string;
  submitted: boolean;
};

type ClosedViewProps = {
  sprintName: string;
  cards: Card[];
  actionItems: ActionItem[];
  participants: Participant[];
  isFacilitator: boolean;
  onBack: () => void;
};

const columnLabel = {
  well: "WENT WELL",
  improve: "NEEDS IMPROVEMENT",
  questions: "OPEN QUESTIONS",
} as const;

function formatDate(d: Date) {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function buildRecapBody(
  sprintName: string,
  cards: Card[],
  actionItems: ActionItem[],
): string {
  const date = formatDate(new Date());
  const sorted = (list: Card[]) =>
    [...list].sort((a, b) => b.voteCount - a.voteCount);

  const well = sorted(cards.filter((c) => c.column === "well"));
  const improve = sorted(cards.filter((c) => c.column === "improve"));
  const questions = sorted(cards.filter((c) => c.column === "questions"));

  const lines: string[] = [];
  lines.push(`Retro recap — ${sprintName} — ${date}`, "");

  lines.push("ACTION ITEMS");
  if (actionItems.length === 0) {
    lines.push("No actions were defined.");
  } else {
    actionItems.forEach((a, i) => lines.push(`${i + 1}. ${a.title} — ${a.ownerName}`));
  }

  if (well.length > 0) {
    lines.push("", "WENT WELL");
    well.forEach((c) => lines.push(`- ${c.text}`));
  }
  if (improve.length > 0) {
    lines.push("", "NEEDS IMPROVEMENT");
    improve.forEach((c) => lines.push(`- ${c.text}`));
  }
  if (questions.length > 0) {
    lines.push("", "OPEN QUESTIONS");
    questions.forEach((c) => lines.push(`- ${c.text}`));
  }

  return lines.join("\n");
}

function buildMailtoLink(
  sprintName: string,
  participants: Participant[],
  body: string,
): string {
  const date = formatDate(new Date());
  const to = participants.map((p) => p.email).join(",");
  const subject = `Retro recap — ${sprintName} — ${date}`;
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function ClosedView({
  sprintName,
  cards,
  actionItems,
  participants,
  isFacilitator,
  onBack,
}: ClosedViewProps) {
  const body = buildRecapBody(sprintName, cards, actionItems);
  const mailtoLink = isFacilitator
    ? buildMailtoLink(sprintName, participants, body)
    : null;
  const tooLong = mailtoLink !== null && mailtoLink.length > 2000;
  const mailtoOpenedRef = useRef(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isFacilitator || !mailtoLink || tooLong || mailtoOpenedRef.current) return;
    mailtoOpenedRef.current = true;
    window.location.href = mailtoLink;
  }, [isFacilitator, mailtoLink, tooLong]);

  const sorted = (list: Card[]) =>
    [...list].sort((a, b) => b.voteCount - a.voteCount);
  const well = sorted(cards.filter((c) => c.column === "well"));
  const improve = sorted(cards.filter((c) => c.column === "improve"));
  const questions = sorted(cards.filter((c) => c.column === "questions"));

  function handleCopy() {
    navigator.clipboard.writeText(body).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      className="min-h-screen px-4 py-10"
      style={{ background: "#260B32" }}
    >
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"
            style={{ background: "rgba(48,255,226,0.12)" }}
          >
            ✓
          </div>
          <h2 className="text-white text-2xl font-medium mb-1">
            Retro completed!
          </h2>
          <p className="text-sm" style={{ color: "#A159A1" }}>
            {sprintName}
          </p>
        </div>

        {/* Facilitator: mailto too-long fallback */}
        {isFacilitator && tooLong && (
          <div
            className="rounded-2xl p-5 mb-6"
            style={{
              background: "rgba(255,107,107,0.1)",
              border: "1px solid rgba(255,107,107,0.3)",
            }}
          >
            <p className="text-sm font-medium mb-3" style={{ color: "#FF9A9A" }}>
              The recap is too long to pre-fill your email client. Copy it manually below.
            </p>
            <textarea
              readOnly
              value={body}
              rows={8}
              className="w-full rounded-xl px-3 py-2.5 text-xs font-mono resize-none outline-none"
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "#F2E3F2",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            />
            <button
              type="button"
              onClick={handleCopy}
              className="mt-3 w-full py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
              style={{ background: "#822E7B" }}
            >
              {copied ? "Copied!" : "Copy recap text"}
            </button>
          </div>
        )}

        {/* Facilitator: open email client button (if not too long) */}
        {isFacilitator && !tooLong && mailtoLink && (
          <a
            href={mailtoLink}
            className="block w-full py-3 rounded-xl text-center text-sm font-medium text-white transition-all hover:opacity-90 mb-6"
            style={{ background: "#822E7B" }}
          >
            Open email client to send recap ✉
          </a>
        )}

        {/* Readable recap */}
        <div
          className="rounded-2xl p-6 mb-6 space-y-5"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {/* Action items */}
          <div>
            <h3
              className="text-xs font-medium uppercase tracking-widest mb-3"
              style={{ color: "#CD68C5" }}
            >
              Action Items
            </h3>
            {actionItems.length === 0 ? (
              <p className="text-sm" style={{ color: "#A159A1" }}>
                No actions were defined.
              </p>
            ) : (
              <div className="space-y-2">
                {actionItems.map((item, i) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium shrink-0 mt-0.5"
                      style={{ background: "rgba(130,46,123,0.4)", color: "#F2E3F2" }}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#F2E3F2" }}>
                        {item.title}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "#A159A1" }}>
                        {item.ownerName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cards by column */}
          {(
            [
              { key: "well" as const, cards: well },
              { key: "improve" as const, cards: improve },
              { key: "questions" as const, cards: questions },
            ] as const
          )
            .filter(({ cards: c }) => c.length > 0)
            .map(({ key, cards: colCards }) => (
              <div key={key}>
                <h3
                  className="text-xs font-medium uppercase tracking-widest mb-3"
                  style={{ color: "#CD68C5" }}
                >
                  {columnLabel[key]}
                </h3>
                <div className="space-y-1.5">
                  {colCards.map((card) => (
                    <p
                      key={card.id}
                      className="text-sm leading-snug"
                      style={{ color: "#F2E3F2" }}
                    >
                      – {card.text}
                    </p>
                  ))}
                </div>
              </div>
            ))}
        </div>

        <button
          type="button"
          onClick={onBack}
          className="w-full py-3 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          Start a new retro
        </button>
      </div>
    </div>
  );
}
