"use client";

import { useMutation } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/libs/trpc/client";

type View = "home" | "create" | "join";

export default function RetroHomePage() {
  const [view, setView] = useState<View>("home");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const trpc = useTRPC();

  // Create session form state
  const [sprintName, setSprintName] = useState("");
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");

  // Join session form state
  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinEmail, setJoinEmail] = useState("");

  const createMutation = useMutation(
    trpc.retro.createSession.mutationOptions({
      onSuccess: (data) => {
        const code = data.session?.code;
        if (!code) return;
        localStorage.setItem(
          `retro:${code}`,
          JSON.stringify({ participantId: data.participantId, isFacilitator: true }),
        );
        router.push(`/${locale}/retro/${code}`);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const joinMutation = useMutation(
    trpc.retro.joinSession.mutationOptions({
      onSuccess: (data) => {
        localStorage.setItem(
          `retro:${data.code}`,
          JSON.stringify({ participantId: data.participantId, isFacilitator: false }),
        );
        router.push(`/${locale}/retro/${data.code}`);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#260B32", color: "#FFFFFF" }}
    >
      {/* Header */}
      <header
        className="px-6 py-4 flex items-center"
        style={{ backgroundColor: "#260B32" }}
      >
        <button
          type="button"
          onClick={() => setView("home")}
          className="text-white font-medium text-lg tracking-tight hover:opacity-80 transition-opacity"
        >
          Agile Retro
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        {view === "home" && (
          <div className="w-full max-w-2xl">
            <h1 className="text-3xl font-medium text-center mb-2">
              Run better retrospectives
            </h1>
            <p className="text-center mb-10" style={{ color: "#CD68C5" }}>
              Collect feedback, vote on cards, and turn insights into actions.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                type="button"
                onClick={() => setView("create")}
                className="rounded-xl p-8 text-left transition-transform hover:scale-[1.02] cursor-pointer"
                style={{ backgroundColor: "#5E2460" }}
              >
                <div
                  className="text-2xl mb-3"
                  style={{ color: "#30FFE2" }}
                >
                  ✦
                </div>
                <h2 className="text-xl font-medium mb-2">Run a retro</h2>
                <p className="text-sm" style={{ color: "#CD68C5" }}>
                  Create a new session and invite your team with a 6-character
                  code.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setView("join")}
                className="rounded-xl p-8 text-left transition-transform hover:scale-[1.02] cursor-pointer"
                style={{ backgroundColor: "#5E2460" }}
              >
                <div
                  className="text-2xl mb-3"
                  style={{ color: "#30FFE2" }}
                >
                  →
                </div>
                <h2 className="text-xl font-medium mb-2">Join a session</h2>
                <p className="text-sm" style={{ color: "#CD68C5" }}>
                  Enter the session code shared by your facilitator.
                </p>
              </button>
            </div>
          </div>
        )}

        {view === "create" && (
          <div className="w-full max-w-md">
            <button
              type="button"
              onClick={() => setView("home")}
              className="text-sm mb-6 flex items-center gap-1 hover:opacity-80"
              style={{ color: "#CD68C5" }}
            >
              ← Back
            </button>
            <h2 className="text-2xl font-medium mb-6">Create a session</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate({
                  sprintName,
                  displayName: createName,
                  email: createEmail,
                });
              }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1">
                <label htmlFor="create-sprint" className="text-sm font-medium" style={{ color: "#CD68C5" }}>
                  Sprint name
                </label>
                <input
                  id="create-sprint"
                  type="text"
                  value={sprintName}
                  onChange={(e) => setSprintName(e.target.value)}
                  placeholder="e.g. Sprint 42"
                  required
                  className="rounded-lg px-4 py-3 text-sm outline-none"
                  style={{
                    backgroundColor: "#5E2460",
                    color: "#FFFFFF",
                    border: "1px solid #A159A1",
                  }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="create-name" className="text-sm font-medium" style={{ color: "#CD68C5" }}>
                  Your name
                </label>
                <input
                  id="create-name"
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Display name"
                  required
                  className="rounded-lg px-4 py-3 text-sm outline-none"
                  style={{
                    backgroundColor: "#5E2460",
                    color: "#FFFFFF",
                    border: "1px solid #A159A1",
                  }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="create-email" className="text-sm font-medium" style={{ color: "#CD68C5" }}>
                  Your email
                </label>
                <input
                  id="create-email"
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="rounded-lg px-4 py-3 text-sm outline-none"
                  style={{
                    backgroundColor: "#5E2460",
                    color: "#FFFFFF",
                    border: "1px solid #A159A1",
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="mt-2 rounded-lg px-4 py-3 font-medium text-white text-sm transition-opacity disabled:opacity-50"
                style={{ backgroundColor: "#822E7B" }}
              >
                {createMutation.isPending ? "Creating…" : "Create session"}
              </button>
            </form>
          </div>
        )}

        {view === "join" && (
          <div className="w-full max-w-md">
            <button
              type="button"
              onClick={() => setView("home")}
              className="text-sm mb-6 flex items-center gap-1 hover:opacity-80"
              style={{ color: "#CD68C5" }}
            >
              ← Back
            </button>
            <h2 className="text-2xl font-medium mb-6">Join a session</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                joinMutation.mutate({
                  code: joinCode,
                  displayName: joinName,
                  email: joinEmail,
                });
              }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1">
                <label htmlFor="join-code" className="text-sm font-medium" style={{ color: "#CD68C5" }}>
                  Session code
                </label>
                <input
                  id="join-code"
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  maxLength={6}
                  required
                  className="rounded-lg px-4 py-3 text-sm outline-none font-mono tracking-widest uppercase"
                  style={{
                    backgroundColor: "#5E2460",
                    color: "#FFFFFF",
                    border: "1px solid #A159A1",
                  }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="join-name" className="text-sm font-medium" style={{ color: "#CD68C5" }}>
                  Your name
                </label>
                <input
                  id="join-name"
                  type="text"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  placeholder="Display name"
                  required
                  className="rounded-lg px-4 py-3 text-sm outline-none"
                  style={{
                    backgroundColor: "#5E2460",
                    color: "#FFFFFF",
                    border: "1px solid #A159A1",
                  }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="join-email" className="text-sm font-medium" style={{ color: "#CD68C5" }}>
                  Your email
                </label>
                <input
                  id="join-email"
                  type="email"
                  value={joinEmail}
                  onChange={(e) => setJoinEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="rounded-lg px-4 py-3 text-sm outline-none"
                  style={{
                    backgroundColor: "#5E2460",
                    color: "#FFFFFF",
                    border: "1px solid #A159A1",
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={joinMutation.isPending}
                className="mt-2 rounded-lg px-4 py-3 font-medium text-white text-sm transition-opacity disabled:opacity-50"
                style={{ backgroundColor: "#822E7B" }}
              >
                {joinMutation.isPending ? "Joining…" : "Join session"}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
