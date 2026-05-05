"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/libs/trpc/client";
import { ConfirmDialog } from "./confirm-dialog";

type Card = {
  id: string;
  column: "well" | "improve" | "questions";
  text: string;
  voteCount: number;
};

const COLUMNS = [
  { key: "well" as const, label: "Went well", emoji: "✅", color: "#5E2460" },
  {
    key: "improve" as const,
    label: "Needs improvement",
    emoji: "🔧",
    color: "#822E7B",
  },
  {
    key: "questions" as const,
    label: "Open questions",
    emoji: "❓",
    color: "#A159A1",
  },
];

type DiscussingPhaseProps = {
  cards: Card[];
  isFacilitator: boolean;
  code: string;
  facilitatorToken: string;
};

export function DiscussingPhase({
  cards,
  isFacilitator,
  code,
  facilitatorToken,
}: DiscussingPhaseProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: trpc.retro.getSession.queryKey({ code }),
    });

  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false);

  // Stable random order per card — assigned once, preserved across re-renders (polls update voteCount)
  const shuffleOrderRef = useRef<Map<string, number>>(new Map());
  function getShuffledColumn(colCards: Card[]) {
    const order = shuffleOrderRef.current;
    for (const card of colCards) {
      if (!order.has(card.id)) order.set(card.id, Math.random());
    }
    return [...colCards].sort(
      (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
    );
  }

  const voteMutation = useMutation(
    trpc.retro.voteCard.mutationOptions({
      onSuccess: invalidate,
      onError: () => toast.error("Failed to vote"),
    }),
  );

  const advanceMutation = useMutation(
    trpc.retro.advanceToActions.mutationOptions({
      onSuccess: invalidate,
      onError: () => toast.error("Failed to advance"),
    }),
  );

  const totalVotes = cards.reduce((sum, c) => sum + c.voteCount, 0);

  return (
    <div>
      <ConfirmDialog
        open={showAdvanceDialog}
        title="Move to action planning?"
        description="Votes will be locked. No more voting after this."
        confirmLabel="Go to actions"
        onConfirm={() => {
          setShowAdvanceDialog(false);
          advanceMutation.mutate({ code, facilitatorToken });
        }}
        onCancel={() => setShowAdvanceDialog(false)}
      />

      <div className="text-center mb-6">
        <h2 className="text-xl font-medium mb-1" style={{ color: "#260B32" }}>
          Group discussion
        </h2>
        <p className="text-sm" style={{ color: "#A159A1" }}>
          All cards are visible. Vote on what matters most.
          {/* MVP: voting is unlimited per participant — no per-person vote tracking */}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {COLUMNS.map((col) => {
          const colCards = getShuffledColumn(
            cards.filter((c) => c.column === col.key),
          );

          return (
            <div
              key={col.key}
              className="rounded-2xl overflow-hidden"
              style={{ background: "white", border: "1px solid #F2E3F2" }}
            >
              <div
                className="px-4 py-3 flex items-center gap-2"
                style={{ background: col.color }}
              >
                <span>{col.emoji}</span>
                <span className="text-white text-sm font-medium">
                  {col.label}
                </span>
                <span
                  className="ml-auto text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
                >
                  {colCards.length}
                </span>
              </div>

              <div className="p-3 space-y-2 min-h-30">
                {colCards.length === 0 && (
                  <p
                    className="text-center text-xs py-6"
                    style={{ color: "#CD68C5" }}
                  >
                    No cards
                  </p>
                )}
                {colCards.map((card) => (
                  <div
                    key={card.id}
                    className="px-3 py-3 rounded-lg text-sm"
                    style={{
                      background: "#F9F4F9",
                      border: "1px solid #F2E3F2",
                    }}
                  >
                    <p className="mb-2 leading-snug" style={{ color: "#331141" }}>
                      {card.text}
                    </p>
                    <div className="flex items-center justify-between">
                      {/* Vote pill — only shown when at least one vote (US-03 AC3) */}
                      {card.voteCount > 0 ? (
                        <span
                          className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                          style={{ background: "#F2E3F2", color: "#5E2460" }}
                        >
                          {card.voteCount}{" "}
                          {card.voteCount === 1 ? "vote" : "votes"}
                        </span>
                      ) : (
                        <span />
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          voteMutation.mutate({ code, cardId: card.id })
                        }
                        disabled={voteMutation.isPending}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
                        style={{ background: "#822E7B", color: "white" }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: "#A159A1" }}>
          {totalVotes} total votes
        </span>
        {isFacilitator && (
          <button
            type="button"
            onClick={() => setShowAdvanceDialog(true)}
            disabled={advanceMutation.isPending}
            className="px-8 py-3 rounded-xl font-medium text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
            style={{ background: "#822E7B" }}
          >
            Go to actions →
          </button>
        )}
      </div>
    </div>
  );
}
