"use client";

import { useMutation } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/libs/trpc/client";

export function RetroLanding() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const trpc = useTRPC();

  const [sprintName, setSprintName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinEmail, setJoinEmail] = useState("");
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  const createMutation = useMutation(
    trpc.retro.createSession.mutationOptions({
      onSuccess: (data) => {
        // MVP: facilitatorToken persisted in localStorage — simplified auth, not OAuth/session-based
        localStorage.setItem(
          `retro_facilitator_${data.code}`,
          data.facilitatorToken,
        );
        setCreatedCode(data.code);
      },
      onError: () => toast.error("Failed to create session"),
    }),
  );

  const joinMutation = useMutation(
    trpc.retro.joinSession.mutationOptions({
      onSuccess: (data, variables) => {
        const code = variables.code;
        localStorage.setItem(`retro_participant_${code}`, data.participantId);
        router.push(`/${locale}/retro/${code}`);
      },
      onError: () => toast.error("Session not found or already closed"),
    }),
  );

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!sprintName.trim()) return;
    createMutation.mutate({ sprintName: sprintName.trim() });
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!joinCode.trim() || !joinName.trim() || !joinEmail.trim()) return;
    joinMutation.mutate({
      code: joinCode.trim().toUpperCase(),
      displayName: joinName.trim(),
      email: joinEmail.trim(),
    });
  }

  function goToSession() {
    if (createdCode) router.push(`/${locale}/retro/${createdCode}`);
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{
        background:
          "linear-gradient(135deg, #260B32 0%, #5E2460 50%, #822E7B 100%)",
      }}
    >
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg"
            style={{
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(8px)",
            }}
          >
            ✦
          </div>
          <span className="text-white text-2xl font-medium tracking-wide">
            Agile Retro
          </span>
        </div>
        <p className="text-[#CD68C5] text-sm">Powered by GELLIFY</p>
      </div>

      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6">
        {/* Create Session */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <h2 className="text-white text-xl font-medium mb-1">
            Create a retro
          </h2>
          <p className="text-[#CD68C5] text-sm mb-6">
            Start a new session for your team
          </p>

          {createdCode ? (
            <div className="text-center">
              <p className="text-[#F2E3F2] text-sm mb-3">
                Share this code with your team
              </p>
              <div
                className="text-white text-5xl font-medium tracking-[0.3em] mb-6 py-5 rounded-xl"
                style={{ background: "rgba(255,255,255,0.1)" }}
              >
                {createdCode}
              </div>
              <button
                type="button"
                onClick={goToSession}
                className="w-full py-3 rounded-xl font-medium text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: "#822E7B" }}
              >
                Enter session →
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label
                  htmlFor="sprint-name"
                  className="text-[#F2E3F2] text-sm font-medium block mb-1.5"
                >
                  Sprint name
                </label>
                <input
                  id="sprint-name"
                  type="text"
                  value={sprintName}
                  onChange={(e) => setSprintName(e.target.value)}
                  placeholder="e.g. Sprint 42"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#CD68C5]"
                  style={{ background: "white", color: "#331141" }}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full py-3 rounded-xl font-medium text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                style={{ background: "#822E7B" }}
              >
                {createMutation.isPending ? "Creating…" : "Create session"}
              </button>
            </form>
          )}
        </div>

        {/* Join Session */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <h2 className="text-white text-xl font-medium mb-1">Join a retro</h2>
          <p className="text-[#CD68C5] text-sm mb-6">
            Enter the code shared by your facilitator
          </p>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label
                htmlFor="join-code"
                className="text-[#F2E3F2] text-sm font-medium block mb-1.5"
              >
                Session code
              </label>
              <input
                id="join-code"
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                className="w-full px-4 py-3 rounded-xl text-sm font-medium tracking-widest uppercase outline-none focus:ring-2 focus:ring-[#CD68C5]"
                style={{ background: "white", color: "#331141" }}
                required
              />
            </div>
            <div>
              <label
                htmlFor="join-name"
                className="text-[#F2E3F2] text-sm font-medium block mb-1.5"
              >
                Your name
              </label>
              <input
                id="join-name"
                type="text"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                placeholder="Anna Rossi"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#CD68C5]"
                style={{ background: "white", color: "#331141" }}
                required
              />
            </div>
            <div>
              <label
                htmlFor="join-email"
                className="text-[#F2E3F2] text-sm font-medium block mb-1.5"
              >
                Email address
              </label>
              <input
                id="join-email"
                type="email"
                value={joinEmail}
                onChange={(e) => setJoinEmail(e.target.value)}
                placeholder="anna@example.com"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#CD68C5]"
                style={{ background: "white", color: "#331141" }}
                required
              />
            </div>
            <button
              type="submit"
              disabled={joinMutation.isPending}
              className="w-full py-3 rounded-xl font-medium text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
              style={{ background: "#5E2460", border: "1px solid #822E7B" }}
            >
              {joinMutation.isPending ? "Joining…" : "Join session"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
