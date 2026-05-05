"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/libs/trpc/client";

type Participant = {
  id: string;
  displayName: string;
  submitted: boolean;
};

type WaitingRoomProps = {
  participants: Participant[];
  isFacilitator: boolean;
  code: string;
  facilitatorToken: string;
};

export function WaitingRoom({
  participants,
  isFacilitator,
  code,
  facilitatorToken,
}: WaitingRoomProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const startMutation = useMutation(
    trpc.retro.startSession.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: trpc.retro.getSession.queryKey({ code }),
        }),
      onError: () => toast.error("Failed to start session"),
    }),
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <div
          className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl"
          style={{ background: "#F2E3F2", border: "3px solid #CD68C5" }}
        >
          ⏳
        </div>
        <h2 className="text-2xl font-medium mb-2" style={{ color: "#260B32" }}>
          Waiting room
        </h2>
        <p className="text-sm" style={{ color: "#A159A1" }}>
          {isFacilitator
            ? "Waiting for participants to join. Start when you're ready."
            : "Waiting for the facilitator to start the session…"}
        </p>
      </div>

      {/* Participant list */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{ background: "white", border: "1px solid #F2E3F2" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-sm" style={{ color: "#5E2460" }}>
            Participants
          </h3>
          <span
            className="text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ background: "#F2E3F2", color: "#822E7B" }}
          >
            {participants.length} joined
          </span>
        </div>

        {participants.length === 0 ? (
          <p className="text-center text-sm py-6" style={{ color: "#A159A1" }}>
            No one has joined yet
          </p>
        ) : (
          <div className="space-y-2">
            {participants.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                style={{ background: "#F9F4F9" }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                  style={{ background: "#822E7B" }}
                >
                  {p.displayName[0]?.toUpperCase() ?? "?"}
                </div>
                <span
                  className="flex-1 text-sm font-medium"
                  style={{ color: "#331141" }}
                >
                  {p.displayName}
                </span>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: "#30FFE2" }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {isFacilitator && (
        <button
          type="button"
          onClick={() => startMutation.mutate({ code, facilitatorToken })}
          disabled={startMutation.isPending || participants.length === 0}
          className="w-full py-4 rounded-xl font-medium text-white text-base transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
          style={{ background: "#822E7B" }}
        >
          {startMutation.isPending ? "Starting…" : "Start session →"}
        </button>
      )}
    </div>
  );
}
