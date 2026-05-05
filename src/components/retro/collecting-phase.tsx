"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/libs/trpc/client";
import { ConfirmDialog } from "./confirm-dialog";

type Card = {
  id: string;
  column: "well" | "improve" | "questions";
  text: string;
  voteCount: number;
};

type Participant = {
  id: string;
  displayName: string;
  submitted: boolean;
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

type CollectingPhaseProps = {
  participants: Participant[];
  cards: Card[];
  isFacilitator: boolean;
  code: string;
  participantId: string;
  facilitatorToken: string;
};

export function CollectingPhase({
  participants,
  cards,
  isFacilitator,
  code,
  participantId,
  facilitatorToken,
}: CollectingPhaseProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: trpc.retro.getSession.queryKey({ code }),
    });

  const [inputs, setInputs] = useState({ well: "", improve: "", questions: "" });
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCardId) editInputRef.current?.focus();
  }, [editingCardId]);


  const addCardMutation = useMutation(
    trpc.retro.addCard.mutationOptions({
      onSuccess: invalidate,
      onError: () => toast.error("Failed to add card"),
    }),
  );

  const updateCardMutation = useMutation(
    trpc.retro.updateCard.mutationOptions({
      onSuccess: invalidate,
      onError: () => toast.error("Failed to update card"),
    }),
  );

  const deleteCardMutation = useMutation(
    trpc.retro.deleteCard.mutationOptions({
      onSuccess: invalidate,
      onError: () => toast.error("Failed to delete card"),
    }),
  );

  const submitMutation = useMutation(
    trpc.retro.submitCards.mutationOptions({
      onSuccess: invalidate,
      onError: () => toast.error("Failed to submit"),
    }),
  );

  const revealMutation = useMutation(
    trpc.retro.revealCards.mutationOptions({
      onSuccess: invalidate,
      onError: () => toast.error("Failed to reveal"),
    }),
  );

  function handleAddCard(column: "well" | "improve" | "questions") {
    const text = inputs[column].trim();
    if (!text) return;
    addCardMutation.mutate({ code, participantId, column, text });
    setInputs((prev) => ({ ...prev, [column]: "" }));
  }

  function handleEditStart(card: Card) {
    setEditingCardId(card.id);
    setEditingText(card.text);
  }

  function handleEditSave() {
    if (!editingCardId) return;
    const text = editingText.trim();
    if (text) {
      updateCardMutation.mutate({ code, participantId, cardId: editingCardId, text });
    }
    setEditingCardId(null);
    setEditingText("");
  }

  function handleEditKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); handleEditSave(); }
    if (e.key === "Escape") { setEditingCardId(null); setEditingText(""); }
  }

  const doneCount = participants.filter((p) => p.submitted).length;

  if (isFacilitator) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-xl font-medium mb-1" style={{ color: "#260B32" }}>
            Collecting feedback
          </h2>
          <p className="text-sm" style={{ color: "#A159A1" }}>
            Participants are writing their cards privately.
          </p>
        </div>

        <div
          className="rounded-2xl p-6 mb-6"
          style={{ background: "white", border: "1px solid #F2E3F2" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-sm" style={{ color: "#5E2460" }}>
              Submission status
            </h3>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: "#F2E3F2", color: "#822E7B" }}
            >
              {doneCount} / {participants.length} done
            </span>
          </div>
          <div className="space-y-2">
            {participants.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                style={{ background: "#F9F4F9" }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                  style={{ background: p.submitted ? "#5E2460" : "#CD68C5" }}
                >
                  {p.displayName[0]?.toUpperCase() ?? "?"}
                </div>
                <span
                  className="flex-1 text-sm font-medium"
                  style={{ color: "#331141" }}
                >
                  {p.displayName}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: p.submitted ? "#F2E3F2" : "rgba(0,0,0,0.05)",
                    color: p.submitted ? "#5E2460" : "#A159A1",
                  }}
                >
                  {p.submitted ? "Done" : "Writing…"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => revealMutation.mutate({ code, facilitatorToken })}
          disabled={revealMutation.isPending || doneCount === 0}
          className="w-full py-4 rounded-xl font-medium text-white text-base transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
          style={{ background: "#822E7B" }}
        >
          {revealMutation.isPending
            ? "Revealing…"
            : `Reveal cards (${doneCount} submitted)`}
        </button>
      </div>
    );
  }

  // Participant view
  const isSubmitted =
    participants.find((p) => p.id === participantId)?.submitted === true;

  return (
    <div>
      <ConfirmDialog
        open={showSubmitDialog}
        title="Submit your feedback?"
        description="You won't be able to edit your cards after this."
        confirmLabel="Submit"
        onConfirm={() => {
          setShowSubmitDialog(false);
          submitMutation.mutate({ code, participantId });
        }}
        onCancel={() => setShowSubmitDialog(false)}
      />

      <div className="text-center mb-6">
        <h2 className="text-xl font-medium mb-1" style={{ color: "#260B32" }}>
          Write your feedback
        </h2>
        <p className="text-sm" style={{ color: "#A159A1" }}>
          Your cards are private until the facilitator reveals them.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {COLUMNS.map((col) => {
          const colCards = cards.filter((c) => c.column === col.key);
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
                {colCards.map((card) => (
                  <div
                    key={card.id}
                    className="group relative px-3 py-2.5 rounded-lg text-sm"
                    style={{
                      background: "#F9F4F9",
                      color: "#331141",
                      border: "1px solid #F2E3F2",
                    }}
                  >
                    {editingCardId === card.id ? (
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={handleEditKeyDown}
                        onBlur={handleEditSave}
                        maxLength={300}
                        className="w-full bg-transparent outline-none text-sm"
                        style={{ color: "#331141" }}
                      />
                    ) : (
                      <>
                        <span className="pr-12">{card.text}</span>
                        {!isSubmitted && (
                          <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleEditStart(card)}
                              className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                              style={{ background: "#F2E3F2", color: "#822E7B" }}
                              title="Edit"
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                deleteCardMutation.mutate({
                                  code,
                                  participantId,
                                  cardId: card.id,
                                })
                              }
                              className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                              style={{ background: "#CD68C5", color: "white" }}
                              title="Delete"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>

              {!isSubmitted && (
                <div className="px-3 pb-3 flex gap-2">
                  <input
                    type="text"
                    value={inputs[col.key]}
                    onChange={(e) =>
                      setInputs((prev) => ({ ...prev, [col.key]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddCard(col.key);
                    }}
                    placeholder="Add a card…"
                    maxLength={300}
                    className="flex-1 px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#CD68C5]"
                    style={{
                      background: "#F9F4F9",
                      color: "#331141",
                      border: "1px solid #F2E3F2",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCard(col.key)}
                    disabled={!inputs[col.key].trim()}
                    className="w-8 h-8 rounded-lg text-white text-lg flex items-center justify-center transition-all hover:opacity-90 disabled:opacity-30"
                    style={{ background: col.color }}
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!isSubmitted ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShowSubmitDialog(true)}
            disabled={submitMutation.isPending}
            className="px-10 py-3 rounded-xl font-medium text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
            style={{ background: "#822E7B" }}
          >
            {submitMutation.isPending ? "Submitting…" : "Done ✓"}
          </button>
        </div>
      ) : (
        <div className="text-center py-4">
          <div
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl"
            style={{ background: "#F2E3F2", color: "#5E2460" }}
          >
            <span style={{ color: "#30FFE2" }}>✓</span>
            <span className="text-sm font-medium">
              Cards submitted — waiting for facilitator to reveal…
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
