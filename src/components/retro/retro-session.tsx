"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/libs/trpc/client";
import { ActionsPhase } from "./actions-phase";
import { CollectingPhase } from "./collecting-phase";
import { DiscussingPhase } from "./discussing-phase";
import { PhaseIndicator } from "./phase-indicator";
import { WaitingRoom } from "./waiting-room";

type Identity =
  | { role: "facilitator"; facilitatorToken: string }
  | { role: "participant"; participantId: string }
  | null;

type RetroSessionProps = { code: string };

export function RetroSession({ code }: RetroSessionProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const trpc = useTRPC();

  // MVP: identity resolved from localStorage — simplified auth for hackathon demo
  const [identity, setIdentity] = useState<Identity>(null);
  const [identityResolved, setIdentityResolved] = useState(false);

  useEffect(() => {
    const facilitatorToken = localStorage.getItem(`retro_facilitator_${code}`);
    const participantId = localStorage.getItem(`retro_participant_${code}`);

    if (facilitatorToken) {
      setIdentity({ role: "facilitator", facilitatorToken });
    } else if (participantId) {
      setIdentity({ role: "participant", participantId });
    }
    setIdentityResolved(true);
  }, [code]);

  const sessionQuery = useQuery({
    ...trpc.retro.getSession.queryOptions({
      code,
      facilitatorToken:
        identity?.role === "facilitator"
          ? identity.facilitatorToken
          : undefined,
      participantId:
        identity?.role === "participant" ? identity.participantId : undefined,
    }),
    enabled: identityResolved,
    // MVP: polling every 2s for real-time feel — no WebSockets in this MVP
    refetchInterval: identityResolved ? 2000 : false,
    refetchIntervalInBackground: false,
  });

  if (!identityResolved) return <RetroLoader />;

  if (!identity) {
    return (
      <RetroJoinInline
        code={code}
        locale={locale}
        onJoined={(participantId) =>
          setIdentity({ role: "participant", participantId })
        }
      />
    );
  }

  if (sessionQuery.isLoading) return <RetroLoader />;

  if (sessionQuery.isError) {
    return (
      <RetroError
        message="Session not found"
        onBack={() => router.push(`/${locale}/retro`)}
      />
    );
  }

  const data = sessionQuery.data;
  if (!data) return <RetroLoader />;

  const { session, participants, cards, actionItems, isFacilitator } = data;

  if (session.status === "closed") {
    return (
      <ClosedView
        sprintName={session.sprintName}
        actionItems={actionItems}
        onBack={() => router.push(`/${locale}/retro`)}
      />
    );
  }

  const facilitatorToken =
    identity.role === "facilitator" ? identity.facilitatorToken : "";
  const participantId =
    identity.role === "participant" ? identity.participantId : "";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#F2E3F2" }}
    >
      {/* Session header */}
      <header
        className="flex items-center justify-between px-6 py-4 shadow-sm"
        style={{ background: "#260B32" }}
      >
        <div className="flex items-center gap-4">
          <span className="text-white font-medium text-lg">
            {session.sprintName}
          </span>
          {isFacilitator && (
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: "#822E7B", color: "#F2E3F2" }}
            >
              Facilitator
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <PhaseIndicator status={session.status} />
          <div
            className="text-xs px-3 py-1.5 rounded-lg font-medium tracking-widest"
            style={{
              background: "rgba(255,255,255,0.1)",
              color: "#CD68C5",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {session.code}
          </div>
        </div>
      </header>

      {/* Phase content */}
      <main className="flex-1 overflow-auto p-6">
        {session.status === "waiting" && (
          <WaitingRoom
            participants={participants}
            isFacilitator={isFacilitator}
            code={code}
            facilitatorToken={facilitatorToken}
          />
        )}

        {session.status === "collecting" && (
          <CollectingPhase
            participants={participants}
            cards={cards}
            isFacilitator={isFacilitator}
            code={code}
            participantId={participantId}
            facilitatorToken={facilitatorToken}
          />
        )}

        {session.status === "discussing" && (
          <DiscussingPhase
            cards={cards}
            isFacilitator={isFacilitator}
            code={code}
            facilitatorToken={facilitatorToken}
          />
        )}

        {session.status === "actions" && (
          <ActionsPhase
            cards={cards}
            actionItems={actionItems}
            isFacilitator={isFacilitator}
            code={code}
            facilitatorToken={facilitatorToken}
            onClosed={() => {
              toast.success(
                "Session closed! Recap email sent to all participants.",
              );
              router.push(`/${locale}/retro`);
            }}
          />
        )}
      </main>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RetroLoader() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#260B32" }}
    >
      <div className="text-center">
        <div
          className="w-10 h-10 rounded-full border-2 animate-spin mx-auto mb-4"
          style={{ borderColor: "#822E7B", borderTopColor: "transparent" }}
        />
        <p className="text-[#CD68C5] text-sm">Loading session…</p>
      </div>
    </div>
  );
}

function RetroError({
  message,
  onBack,
}: {
  message: string;
  onBack: () => void;
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#260B32" }}
    >
      <div className="text-center">
        <p className="text-white text-xl font-medium mb-2">{message}</p>
        <button
          type="button"
          onClick={onBack}
          className="text-[#CD68C5] text-sm underline mt-4"
        >
          ← Back to home
        </button>
      </div>
    </div>
  );
}

function RetroJoinInline({
  code,
  locale,
  onJoined,
}: {
  code: string;
  locale: string;
  onJoined: (participantId: string) => void;
}) {
  const router = useRouter();
  const trpc = useTRPC();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const joinMutation = useMutation(
    trpc.retro.joinSession.mutationOptions({
      onSuccess: (data) => {
        localStorage.setItem(`retro_participant_${code}`, data.participantId);
        onJoined(data.participantId);
      },
      onError: () => toast.error("Could not join session"),
    }),
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    joinMutation.mutate({
      code,
      displayName: name.trim(),
      email: email.trim(),
    });
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background:
          "linear-gradient(135deg, #260B32 0%, #5E2460 60%, #822E7B 100%)",
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        <h2 className="text-white text-xl font-medium mb-1">
          Join retro{" "}
          <span className="tracking-widest" style={{ color: "#CD68C5" }}>
            {code}
          </span>
        </h2>
        <p className="text-[#A159A1] text-sm mb-6">
          Enter your details to participate
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#CD68C5]"
            style={{ background: "white", color: "#331141" }}
            required
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#CD68C5]"
            style={{ background: "white", color: "#331141" }}
            required
          />
          <button
            type="submit"
            disabled={joinMutation.isPending}
            className="w-full py-3 rounded-xl font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "#822E7B" }}
          >
            {joinMutation.isPending ? "Joining…" : "Join →"}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/${locale}/retro`)}
            className="w-full text-center text-sm"
            style={{ color: "#A159A1" }}
          >
            ← Back
          </button>
        </form>
      </div>
    </div>
  );
}

function ClosedView({
  sprintName,
  actionItems,
  onBack,
}: {
  sprintName: string;
  actionItems: Array<{ id: string; title: string; ownerName: string }>;
  onBack: () => void;
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#260B32" }}
    >
      <div className="text-center max-w-md">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl"
          style={{ background: "rgba(48,255,226,0.15)" }}
        >
          ✓
        </div>
        <h2 className="text-white text-2xl font-medium mb-2">
          Retro completed!
        </h2>
        <p className="text-sm mb-8" style={{ color: "#A159A1" }}>
          {sprintName} · Recap email sent to all participants
        </p>
        {actionItems.length > 0 && (
          <div className="text-left mb-8 space-y-2">
            {actionItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: "#30FFE2" }}
                />
                <span className="flex-1 text-sm" style={{ color: "#F2E3F2" }}>
                  {item.title}
                </span>
                <span className="text-xs" style={{ color: "#A159A1" }}>
                  {item.ownerName}
                </span>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={onBack}
          className="px-8 py-3 rounded-xl font-medium text-white transition-all hover:opacity-90"
          style={{ background: "#822E7B" }}
        >
          Start a new retro
        </button>
      </div>
    </div>
  );
}
