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

type ActionItem = {
  id: string;
  title: string;
  ownerName: string;
};

const columnLabel = {
  well: "Went well",
  improve: "Needs improvement",
  questions: "Open questions",
} as const;

const columnColor = {
  well: "#5E2460",
  improve: "#822E7B",
  questions: "#A159A1",
} as const;

type ActionsPhaseProps = {
  cards: Card[];
  actionItems: ActionItem[];
  isFacilitator: boolean;
  code: string;
  facilitatorToken: string;
};

export function ActionsPhase({
  cards,
  actionItems,
  isFacilitator,
  code,
  facilitatorToken,
}: ActionsPhaseProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: trpc.retro.getSession.queryKey({ code }),
    });

  const [actionTitle, setActionTitle] = useState("");
  const [actionOwner, setActionOwner] = useState("");
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const whatInputRef = useRef<HTMLInputElement>(null);

  const addActionMutation = useMutation(
    trpc.retro.addActionItem.mutationOptions({
      onSuccess: () => {
        setActionTitle("");
        setActionOwner("");
        invalidate();
        whatInputRef.current?.focus();
      },
      onError: () => toast.error("Failed to add action item"),
    }),
  );

  const deleteActionMutation = useMutation(
    trpc.retro.deleteActionItem.mutationOptions({
      onSuccess: invalidate,
      onError: () => toast.error("Failed to delete"),
    }),
  );

  const closeMutation = useMutation(
    trpc.retro.closeSession.mutationOptions({
      onSuccess: () => invalidate(),
      onError: () => toast.error("Failed to close session"),
    }),
  );

  // Sort by votes desc; equal votes preserve original (insertion) order
  const sortedCards = [...cards].sort((a, b) => b.voteCount - a.voteCount);

  function handleAddAction(e: React.FormEvent) {
    e.preventDefault();
    if (!actionTitle.trim() || !actionOwner.trim()) return;
    addActionMutation.mutate({
      code,
      facilitatorToken,
      title: actionTitle.trim(),
      ownerName: actionOwner.trim(),
    });
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
      <ConfirmDialog
        open={showCloseDialog}
        title="Close the session?"
        description="This will open your email client with the recap pre-filled. This cannot be undone."
        confirmLabel="Close & send recap"
        onConfirm={() => {
          setShowCloseDialog(false);
          closeMutation.mutate({ code, facilitatorToken });
        }}
        onCancel={() => setShowCloseDialog(false)}
      />

      {/* Left: cards sorted by votes */}
      <div>
        <h2 className="text-lg font-medium mb-4" style={{ color: "#260B32" }}>
          Cards by votes
        </h2>
        <div className="space-y-2">
          {sortedCards.map((card) => (
            <div
              key={card.id}
              className="px-4 py-3 rounded-xl flex items-start gap-3"
              style={{ background: "white", border: "1px solid #F2E3F2" }}
            >
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0 mt-0.5"
                style={{ background: "#F2E3F2", color: "#5E2460" }}
              >
                {card.voteCount}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm leading-snug"
                  style={{ color: "#331141" }}
                >
                  {card.text}
                </p>
                <span
                  className="text-xs mt-1 inline-block"
                  style={{ color: columnColor[card.column] }}
                >
                  {columnLabel[card.column]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: action items */}
      <div>
        <h2 className="text-lg font-medium mb-4" style={{ color: "#260B32" }}>
          Action items
        </h2>

        {isFacilitator && (
          <form
            onSubmit={handleAddAction}
            className="rounded-2xl p-4 mb-4"
            style={{ background: "white", border: "1px solid #F2E3F2" }}
          >
            <p
              className="text-xs font-medium mb-3 uppercase tracking-wide"
              style={{ color: "#5E2460" }}
            >
              Add action
            </p>
            <div className="space-y-2 mb-3">
              <input
                ref={whatInputRef}
                type="text"
                value={actionTitle}
                onChange={(e) => setActionTitle(e.target.value)}
                placeholder="What needs to be done?"
                maxLength={200}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#CD68C5]"
                style={{
                  background: "#F9F4F9",
                  color: "#331141",
                  border: "1px solid #F2E3F2",
                }}
                required
              />
              <input
                type="text"
                value={actionOwner}
                onChange={(e) => setActionOwner(e.target.value)}
                placeholder="Who is responsible?"
                maxLength={50}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#CD68C5]"
                style={{
                  background: "#F9F4F9",
                  color: "#331141",
                  border: "1px solid #F2E3F2",
                }}
                required
              />
            </div>
            <button
              type="submit"
              disabled={
                addActionMutation.isPending ||
                !actionTitle.trim() ||
                !actionOwner.trim()
              }
              className="w-full py-2.5 rounded-lg text-white text-sm font-medium transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: "#822E7B" }}
            >
              {addActionMutation.isPending ? "Adding…" : "Add action item"}
            </button>
          </form>
        )}

        <div className="space-y-2 mb-6">
          {actionItems.length === 0 && (
            <p
              className="text-center text-sm py-8"
              style={{ color: "#A159A1" }}
            >
              No action items yet
            </p>
          )}
          {actionItems.map((item, i) => (
            <div
              key={item.id}
              className="group px-4 py-3 rounded-xl flex items-start gap-3"
              style={{ background: "white", border: "1px solid #F2E3F2" }}
            >
              <span
                className="text-xs font-medium w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: "#F2E3F2", color: "#822E7B" }}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium leading-snug"
                  style={{ color: "#331141" }}
                >
                  {item.title}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#A159A1" }}>
                  Owner: {item.ownerName}
                </p>
              </div>
              {isFacilitator && (
                <button
                  type="button"
                  onClick={() =>
                    deleteActionMutation.mutate({
                      code,
                      facilitatorToken,
                      actionItemId: item.id,
                    })
                  }
                  className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-opacity shrink-0"
                  style={{ background: "#F2E3F2", color: "#822E7B" }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {isFacilitator && (
          <button
            type="button"
            onClick={() => setShowCloseDialog(true)}
            disabled={closeMutation.isPending}
            className="w-full py-4 rounded-xl font-medium text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
            style={{ background: "#260B32" }}
          >
            {closeMutation.isPending
              ? "Closing…"
              : "Close session and send recap ✉"}
          </button>
        )}
      </div>
    </div>
  );
}
