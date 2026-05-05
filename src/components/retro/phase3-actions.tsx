"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import type {
  DB_RetroActionItem,
  DB_RetroFeedbackCard,
  DB_RetroParticipant,
  DB_RetroSession,
} from "@/server/db/schema/retro";
import { useTRPC } from "@/libs/trpc/client";
import type { RetroIdentity } from "./session-room";
import { PrimaryButton, SessionHeader } from "./session-room";

const GELLIFY = {
  darker: "#260B32",
  dark: "#5E2460",
  primary: "#822E7B",
  light: "#A159A1",
  extralight: "#CD68C5",
  teal: "#30FFE2",
};

type Props = {
  session: DB_RetroSession;
  participants: DB_RetroParticipant[];
  cards: DB_RetroFeedbackCard[];
  actionItems: DB_RetroActionItem[];
  identity: RetroIdentity;
  onRefetch: () => void;
};

export function Phase3Actions({
  session,
  cards,
  actionItems,
  identity,
  onRefetch,
}: Props) {
  const trpc = useTRPC();
  const [actionTitle, setActionTitle] = useState("");
  const [actionOwner, setActionOwner] = useState("");

  const sortedCards = [...cards].sort((a, b) => b.voteCount - a.voteCount);

  const addActionMutation = useMutation(
    trpc.retro.addActionItem.mutationOptions({
      onSuccess: () => {
        setActionTitle("");
        setActionOwner("");
        onRefetch();
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const deleteActionMutation = useMutation(
    trpc.retro.deleteActionItem.mutationOptions({
      onSuccess: onRefetch,
      onError: (err) => toast.error(err.message),
    }),
  );

  const closeMutation = useMutation(
    trpc.retro.closeSession.mutationOptions({
      onSuccess: onRefetch,
      onError: (err) => toast.error(err.message),
    }),
  );

  const handleAddAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTitle.trim() || !actionOwner.trim()) return;
    addActionMutation.mutate({
      sessionId: session.id,
      participantId: identity.participantId,
      title: actionTitle.trim(),
      ownerName: actionOwner.trim(),
    });
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: GELLIFY.darker, color: "#FFFFFF" }}
    >
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full flex flex-col gap-6">
        <SessionHeader session={session} />

        <p className="text-sm" style={{ color: GELLIFY.extralight }}>
          Phase 3 — Action planning
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: cards sorted by votes */}
          <div>
            <p
              className="text-xs font-medium mb-3 uppercase tracking-wider"
              style={{ color: GELLIFY.extralight }}
            >
              Cards by votes
            </p>
            <div className="flex flex-col gap-2">
              {sortedCards.map((card) => (
                <div
                  key={card.id}
                  className="flex items-start gap-3 rounded-lg p-3 text-sm"
                  style={{ backgroundColor: GELLIFY.dark }}
                >
                  <span
                    className="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: GELLIFY.extralight,
                      color: GELLIFY.darker,
                    }}
                  >
                    {card.voteCount}
                  </span>
                  <div className="flex-1">
                    <p>{card.text}</p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: GELLIFY.light }}
                    >
                      {card.column === "well"
                        ? "Went well"
                        : card.column === "improve"
                          ? "Needs improvement"
                          : "Open question"}
                    </p>
                  </div>
                </div>
              ))}
              {sortedCards.length === 0 && (
                <p className="text-sm" style={{ color: GELLIFY.light }}>
                  No cards
                </p>
              )}
            </div>
          </div>

          {/* Right: action items */}
          <div className="flex flex-col gap-4">
            {/* Add action form — facilitator only */}
            {identity.isFacilitator && (
              <div
                className="rounded-xl p-4"
                style={{ backgroundColor: GELLIFY.dark }}
              >
                <p
                  className="text-xs font-medium mb-3 uppercase tracking-wider"
                  style={{ color: GELLIFY.extralight }}
                >
                  Add action item
                </p>
                <form onSubmit={handleAddAction} className="flex flex-col gap-3">
                  <input
                    type="text"
                    value={actionTitle}
                    onChange={(e) => setActionTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    required
                    className="rounded-lg px-3 py-2 text-sm outline-none w-full"
                    style={{
                      backgroundColor: GELLIFY.darker,
                      color: "#FFFFFF",
                      border: `1px solid ${GELLIFY.light}`,
                    }}
                  />
                  <input
                    type="text"
                    value={actionOwner}
                    onChange={(e) => setActionOwner(e.target.value)}
                    placeholder="Who owns it?"
                    required
                    className="rounded-lg px-3 py-2 text-sm outline-none w-full"
                    style={{
                      backgroundColor: GELLIFY.darker,
                      color: "#FFFFFF",
                      border: `1px solid ${GELLIFY.light}`,
                    }}
                  />
                  <PrimaryButton
                    type="submit"
                    disabled={addActionMutation.isPending}
                  >
                    {addActionMutation.isPending ? "Adding…" : "Add"}
                  </PrimaryButton>
                </form>
              </div>
            )}

            {/* Action list */}
            <div>
              <p
                className="text-xs font-medium mb-3 uppercase tracking-wider"
                style={{ color: GELLIFY.extralight }}
              >
                Action items ({actionItems.length})
              </p>
              <div className="flex flex-col gap-2">
                {actionItems.map((item, i) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-lg p-3 text-sm"
                    style={{ backgroundColor: GELLIFY.dark }}
                  >
                    <span style={{ color: GELLIFY.extralight }}>{i + 1}.</span>
                    <div className="flex-1">
                      <p>{item.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: GELLIFY.light }}>
                        Owner: {item.ownerName}
                      </p>
                    </div>
                    {identity.isFacilitator && (
                      <button
                        type="button"
                        onClick={() =>
                          deleteActionMutation.mutate({
                            actionId: item.id,
                            participantId: identity.participantId,
                            sessionId: session.id,
                          })
                        }
                        className="text-xs hover:opacity-70"
                        style={{ color: GELLIFY.light }}
                        aria-label="Delete action item"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                {actionItems.length === 0 && (
                  <p className="text-sm" style={{ color: GELLIFY.light }}>
                    No action items yet
                  </p>
                )}
              </div>
            </div>

            {/* Close session — facilitator only */}
            {identity.isFacilitator && (
              <div className="mt-auto pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Close the session and send the recap email to all participants?",
                      )
                    ) {
                      closeMutation.mutate({
                        sessionId: session.id,
                        participantId: identity.participantId,
                      });
                    }
                  }}
                  disabled={closeMutation.isPending}
                  className="w-full rounded-lg px-4 py-3 text-sm font-medium border transition-opacity disabled:opacity-50 hover:opacity-80"
                  style={{
                    borderColor: GELLIFY.light,
                    color: "#FFFFFF",
                    backgroundColor: "transparent",
                  }}
                >
                  {closeMutation.isPending
                    ? "Sending recap…"
                    : "Close session & send recap"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
