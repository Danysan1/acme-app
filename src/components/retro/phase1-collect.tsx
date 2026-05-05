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
  lighter: "#F2E3F2",
  teal: "#30FFE2",
  text: "#331141",
};

const COLUMNS = [
  { key: "well" as const, label: "Went well" },
  { key: "improve" as const, label: "Needs improvement" },
  { key: "questions" as const, label: "Open questions" },
];

type Props = {
  session: DB_RetroSession;
  participants: DB_RetroParticipant[];
  cards: DB_RetroFeedbackCard[];
  actionItems: DB_RetroActionItem[];
  identity: RetroIdentity;
  onRefetch: () => void;
};

export function Phase1Collect({
  session,
  participants,
  cards,
  identity,
  onRefetch,
}: Props) {
  const trpc = useTRPC();
  const [inputs, setInputs] = useState({ well: "", improve: "", questions: "" });

  const me = participants.find((p) => p.id === identity.participantId);
  const submitted = me?.hasSubmitted ?? false;
  const myCards = cards.filter((c) => c.participantId === identity.participantId);

  const addMutation = useMutation(
    trpc.retro.addCard.mutationOptions({
      onSuccess: onRefetch,
      onError: (err) => toast.error(err.message),
    }),
  );

  const deleteMutation = useMutation(
    trpc.retro.deleteCard.mutationOptions({
      onSuccess: onRefetch,
      onError: (err) => toast.error(err.message),
    }),
  );

  const submitMutation = useMutation(
    trpc.retro.submitCards.mutationOptions({
      onSuccess: onRefetch,
      onError: (err) => toast.error(err.message),
    }),
  );

  const revealMutation = useMutation(
    trpc.retro.revealCards.mutationOptions({
      onSuccess: onRefetch,
      onError: (err) => toast.error(err.message),
    }),
  );

  const handleAdd = (column: "well" | "improve" | "questions") => {
    const text = inputs[column].trim();
    if (!text) return;
    addMutation.mutate({
      participantId: identity.participantId,
      sessionId: session.id,
      column,
      text,
    });
    setInputs((prev) => ({ ...prev, [column]: "" }));
  };

  const submittedCount = participants.filter((p) => p.hasSubmitted).length;
  const canReveal = submittedCount >= 1;

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: GELLIFY.darker, color: "#FFFFFF" }}
    >
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full flex flex-col">
        <SessionHeader session={session} />

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm" style={{ color: GELLIFY.extralight }}>
            Phase 1 — Individual feedback
          </p>
          {submitted && (
            <span
              className="text-xs px-3 py-1 rounded-full font-medium"
              style={{ backgroundColor: GELLIFY.dark, color: GELLIFY.teal }}
            >
              Submitted ✓
            </span>
          )}
        </div>

        {/* 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
          {COLUMNS.map((col) => {
            const colCards = myCards.filter((c) => c.column === col.key);
            return (
              <div
                key={col.key}
                className="rounded-xl p-4 flex flex-col gap-3"
                style={{ backgroundColor: GELLIFY.dark }}
              >
                <h3 className="font-medium text-sm" style={{ color: GELLIFY.extralight }}>
                  {col.label}
                </h3>

                {/* Cards */}
                <div className="flex flex-col gap-2 flex-1">
                  {colCards.map((card) => (
                    <div
                      key={card.id}
                      className="flex items-start gap-2 rounded-lg p-3 text-sm"
                      style={{ backgroundColor: GELLIFY.darker }}
                    >
                      <span className="flex-1" style={{ color: "#FFFFFF" }}>
                        {card.text}
                      </span>
                      {!submitted && (
                        <button
                          type="button"
                          onClick={() =>
                            deleteMutation.mutate({
                              cardId: card.id,
                              participantId: identity.participantId,
                            })
                          }
                          className="text-xs shrink-0 hover:opacity-70"
                          style={{ color: GELLIFY.light }}
                          aria-label="Delete card"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add input */}
                {!submitted && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputs[col.key]}
                      onChange={(e) =>
                        setInputs((prev) => ({ ...prev, [col.key]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAdd(col.key);
                        }
                      }}
                      placeholder="Add a card…"
                      className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                      style={{
                        backgroundColor: GELLIFY.darker,
                        color: "#FFFFFF",
                        border: `1px solid ${GELLIFY.light}`,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleAdd(col.key)}
                      disabled={!inputs[col.key].trim() || addMutation.isPending}
                      className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-40 hover:opacity-90"
                      style={{ backgroundColor: GELLIFY.primary, color: "#FFFFFF" }}
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom actions */}
        <div className="mt-6 flex items-center justify-between">
          {!submitted ? (
            <PrimaryButton
              onClick={() =>
                submitMutation.mutate({
                  participantId: identity.participantId,
                  sessionId: session.id,
                })
              }
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? "Submitting…" : "Done"}
            </PrimaryButton>
          ) : (
            <p className="text-sm" style={{ color: GELLIFY.extralight }}>
              Waiting for others to submit…
            </p>
          )}

          {/* Facilitator controls */}
          {identity.isFacilitator && (
            <div className="flex items-center gap-4">
              <span className="text-xs" style={{ color: GELLIFY.extralight }}>
                {submittedCount} / {participants.length} submitted
              </span>
              <PrimaryButton
                onClick={() =>
                  revealMutation.mutate({
                    sessionId: session.id,
                    participantId: identity.participantId,
                  })
                }
                disabled={!canReveal || revealMutation.isPending}
              >
                {revealMutation.isPending ? "Revealing…" : "Reveal cards"}
              </PrimaryButton>
            </div>
          )}
        </div>

        {/* Facilitator participant list */}
        {identity.isFacilitator && (
          <div
            className="mt-4 rounded-xl p-4"
            style={{ backgroundColor: GELLIFY.dark }}
          >
            <p className="text-xs font-medium mb-2" style={{ color: GELLIFY.extralight }}>
              Participants
            </p>
            <div className="flex flex-wrap gap-2">
              {participants.map((p) => (
                <span
                  key={p.id}
                  className="text-xs px-3 py-1 rounded-full flex items-center gap-1"
                  style={{ backgroundColor: GELLIFY.darker }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor: p.hasSubmitted ? GELLIFY.teal : GELLIFY.light,
                    }}
                  />
                  {p.displayName}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
