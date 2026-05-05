"use client";

import { useMutation } from "@tanstack/react-query";
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
};

const COLUMNS = [
  { key: "well", label: "Went well" },
  { key: "improve", label: "Needs improvement" },
  { key: "questions", label: "Open questions" },
] as const;

type Props = {
  session: DB_RetroSession;
  participants: DB_RetroParticipant[];
  cards: DB_RetroFeedbackCard[];
  actionItems: DB_RetroActionItem[];
  identity: RetroIdentity;
  onRefetch: () => void;
};

export function Phase2Discuss({ session, cards, identity, onRefetch }: Props) {
  const trpc = useTRPC();

  const upvoteMutation = useMutation(
    trpc.retro.upvoteCard.mutationOptions({
      onSuccess: onRefetch,
      onError: (err) => toast.error(err.message),
    }),
  );

  const advanceMutation = useMutation(
    trpc.retro.advanceToActions.mutationOptions({
      onSuccess: onRefetch,
      onError: (err) => toast.error(err.message),
    }),
  );

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: GELLIFY.darker, color: "#FFFFFF" }}
    >
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full flex flex-col">
        <SessionHeader session={session} />

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm" style={{ color: GELLIFY.extralight }}>
            Phase 2 — Group discussion
          </p>
          {identity.isFacilitator && (
            <PrimaryButton
              onClick={() =>
                advanceMutation.mutate({
                  sessionId: session.id,
                  participantId: identity.participantId,
                })
              }
              disabled={advanceMutation.isPending}
            >
              {advanceMutation.isPending ? "…" : "Go to actions →"}
            </PrimaryButton>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
          {COLUMNS.map((col) => {
            const colCards = cards
              .filter((c) => c.column === col.key)
              .sort((a, b) => b.voteCount - a.voteCount);

            return (
              <div
                key={col.key}
                className="rounded-xl p-4 flex flex-col gap-3"
                style={{ backgroundColor: GELLIFY.dark }}
              >
                <h3
                  className="font-medium text-sm"
                  style={{ color: GELLIFY.extralight }}
                >
                  {col.label}
                  <span
                    className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: GELLIFY.darker }}
                  >
                    {colCards.length}
                  </span>
                </h3>

                <div className="flex flex-col gap-2">
                  {colCards.map((card) => (
                    <div
                      key={card.id}
                      className="flex items-start gap-2 rounded-lg p-3 text-sm"
                      style={{ backgroundColor: GELLIFY.darker }}
                    >
                      <span className="flex-1">{card.text}</span>
                      <button
                        type="button"
                        onClick={() =>
                          upvoteMutation.mutate({ cardId: card.id })
                        }
                        disabled={upvoteMutation.isPending}
                        className="shrink-0 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium hover:opacity-80 disabled:opacity-50 transition-opacity"
                        style={{
                          backgroundColor: GELLIFY.extralight,
                          color: GELLIFY.darker,
                        }}
                      >
                        + {card.voteCount}
                      </button>
                    </div>
                  ))}

                  {colCards.length === 0 && (
                    <p
                      className="text-xs italic"
                      style={{ color: GELLIFY.light }}
                    >
                      No cards yet
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* TODO: show total vote count per participant and allow facilitator to set vote limits */}
      </div>
    </div>
  );
}
