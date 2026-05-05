"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/libs/trpc/client";
import type {
  DB_RetroActionItem,
  DB_RetroFeedbackCard,
  DB_RetroParticipant,
  DB_RetroSession,
} from "@/server/db/schema/retro";
import { Phase1Collect } from "./phase1-collect";
import { Phase2Discuss } from "./phase2-discuss";
import { Phase3Actions } from "./phase3-actions";

export type RetroIdentity = {
  participantId: string;
  isFacilitator: boolean;
};

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

export function SessionRoom({ code }: { code: string }) {
  const trpc = useTRPC();
  const params = useParams();
  const locale = params.locale as string;

  const [identity, setIdentity] = useState<RetroIdentity | null | "loading">(
    "loading",
  );

  useEffect(() => {
    const stored = localStorage.getItem(`retro:${code}`);
    if (stored) {
      try {
        setIdentity(JSON.parse(stored) as RetroIdentity);
      } catch {
        setIdentity(null);
      }
    } else {
      setIdentity(null);
    }
  }, [code]);

  const { data, refetch } = useQuery({
    ...trpc.retro.getSession.queryOptions({ code }),
    refetchInterval: 2000,
    enabled: identity !== "loading" && identity !== null,
  });

  if (identity === "loading") {
    return <FullPageSpinner />;
  }

  if (identity === null) {
    return (
      <JoinPrompt
        code={code}
        locale={locale}
        onJoined={(id) => setIdentity({ participantId: id, isFacilitator: false })}
      />
    );
  }

  if (!data) {
    return <FullPageSpinner />;
  }

  const { session, participants, cards, actionItems } = data;

  const sharedProps = {
    session,
    participants,
    cards,
    actionItems,
    identity,
    onRefetch: () => void refetch(),
  };

  if (session.status === "waiting") {
    return <WaitingRoom {...sharedProps} />;
  }
  if (session.status === "collecting") {
    return <Phase1Collect {...sharedProps} />;
  }
  if (session.status === "discussing") {
    return <Phase2Discuss {...sharedProps} />;
  }
  if (session.status === "actions") {
    return <Phase3Actions {...sharedProps} />;
  }
  if (session.status === "closed") {
    return <ClosedSession session={session} actionItems={actionItems} />;
  }

  return null;
}

// ── Shared types ─────────────────────────────────────────────────────────────

type SharedProps = {
  session: DB_RetroSession;
  participants: DB_RetroParticipant[];
  cards: DB_RetroFeedbackCard[];
  actionItems: DB_RetroActionItem[];
  identity: RetroIdentity;
  onRefetch: () => void;
};

// ── Waiting room ─────────────────────────────────────────────────────────────

function WaitingRoom({ session, participants, identity, onRefetch }: SharedProps) {
  const trpc = useTRPC();

  const startMutation = useMutation(
    trpc.retro.startSession.mutationOptions({
      onSuccess: onRefetch,
      onError: (err) => toast.error(err.message),
    }),
  );

  return (
    <PageShell>
      <SessionHeader session={session} />
      <div className="flex flex-col items-center gap-8 mt-8">
        {identity.isFacilitator ? (
          <>
            <div
              className="rounded-xl p-6 w-full max-w-sm text-center"
              style={{ backgroundColor: GELLIFY.dark }}
            >
              <p className="text-sm mb-1" style={{ color: GELLIFY.extralight }}>
                Session code
              </p>
              <p className="text-4xl font-medium tracking-widest font-mono">
                {session.code}
              </p>
              <p className="text-xs mt-2" style={{ color: GELLIFY.extralight }}>
                Share this with your team
              </p>
            </div>

            <div className="w-full max-w-sm">
              <p className="text-sm font-medium mb-3" style={{ color: GELLIFY.extralight }}>
                Participants ({participants.length})
              </p>
              <ul className="flex flex-col gap-2">
                {participants.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
                    style={{ backgroundColor: GELLIFY.dark }}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: GELLIFY.teal }} />
                    {p.displayName}
                    {p.isFacilitator && (
                      <span className="ml-auto text-xs" style={{ color: GELLIFY.extralight }}>
                        facilitator
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <PrimaryButton
              onClick={() =>
                startMutation.mutate({
                  sessionId: session.id,
                  participantId: identity.participantId,
                })
              }
              disabled={startMutation.isPending}
            >
              {startMutation.isPending ? "Starting…" : "Start session"}
            </PrimaryButton>
          </>
        ) : (
          <div className="text-center">
            <div className="text-5xl mb-4" style={{ color: GELLIFY.extralight }}>
              ⏳
            </div>
            <p className="text-lg font-medium">Waiting for the facilitator to start…</p>
            <p className="text-sm mt-2" style={{ color: GELLIFY.extralight }}>
              Session: <span className="font-mono font-medium">{session.code}</span>
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
}

// ── Closed session ────────────────────────────────────────────────────────────

function ClosedSession({
  session,
  actionItems,
}: {
  session: DB_RetroSession;
  actionItems: DB_RetroActionItem[];
}) {
  return (
    <PageShell>
      <SessionHeader session={session} />
      <div className="flex flex-col items-center gap-6 mt-8 max-w-lg mx-auto">
        <div className="text-5xl" style={{ color: GELLIFY.teal }}>
          ✓
        </div>
        <p className="text-xl font-medium">Session closed</p>
        <p className="text-sm" style={{ color: GELLIFY.extralight }}>
          A recap email has been sent to all participants.
        </p>
        {actionItems.length > 0 && (
          <div className="w-full">
            <p className="text-sm font-medium mb-3" style={{ color: GELLIFY.extralight }}>
              Action items
            </p>
            <ol className="flex flex-col gap-2">
              {actionItems.map((item, i) => (
                <li
                  key={item.id}
                  className="flex gap-3 px-4 py-3 rounded-lg text-sm"
                  style={{ backgroundColor: GELLIFY.dark }}
                >
                  <span style={{ color: GELLIFY.extralight }}>{i + 1}.</span>
                  <span>
                    {item.title}{" "}
                    <span style={{ color: GELLIFY.extralight }}>— {item.ownerName}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </PageShell>
  );
}

// ── Join prompt (no identity in localStorage) ─────────────────────────────────

function JoinPrompt({
  code,
  // locale is accepted so the parent can pass it; kept for future navigation use
  onJoined,
}: {
  code: string;
  locale: string;
  onJoined: (participantId: string) => void;
}) {
  const trpc = useTRPC();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const joinMutation = useMutation(
    trpc.retro.joinSession.mutationOptions({
      onSuccess: (data) => {
        localStorage.setItem(
          `retro:${data.code}`,
          JSON.stringify({ participantId: data.participantId, isFacilitator: false }),
        );
        onJoined(data.participantId);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  return (
    <PageShell>
      <div className="max-w-md mx-auto mt-12 w-full">
        <h2 className="text-2xl font-medium mb-2">Join session</h2>
        <p className="text-sm mb-6" style={{ color: GELLIFY.extralight }}>
          Code: <span className="font-mono font-medium">{code}</span>
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            joinMutation.mutate({ code, displayName: name, email });
          }}
          className="flex flex-col gap-4"
        >
          <FormInput
            id="join-name"
            label="Your name"
            value={name}
            onChange={setName}
            placeholder="Display name"
            required
          />
          <FormInput
            id="join-email"
            label="Your email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@company.com"
            required
          />
          <PrimaryButton type="submit" disabled={joinMutation.isPending}>
            {joinMutation.isPending ? "Joining…" : "Join session"}
          </PrimaryButton>
        </form>
      </div>
    </PageShell>
  );
}

// ── Shared UI primitives ──────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: GELLIFY.darker, color: "#FFFFFF" }}
    >
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full">{children}</div>
    </div>
  );
}

export function SessionHeader({ session }: { session: DB_RetroSession }) {
  return (
    <div
      className="flex items-center justify-between py-3 border-b mb-6"
      style={{ borderColor: GELLIFY.dark }}
    >
      <div>
        <p className="text-xs" style={{ color: GELLIFY.extralight }}>
          Agile Retro
        </p>
        <h1 className="text-lg font-medium">{session.sprintName}</h1>
      </div>
      <span
        className="text-xs font-mono px-2 py-1 rounded"
        style={{ backgroundColor: GELLIFY.dark, color: GELLIFY.extralight }}
      >
        {session.code}
      </span>
    </div>
  );
}

export function PrimaryButton({
  children,
  disabled,
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg px-6 py-3 font-medium text-white text-sm transition-opacity disabled:opacity-50 hover:opacity-90"
      style={{ backgroundColor: GELLIFY.primary }}
    >
      {children}
    </button>
  );
}

export function FormInput({
  id,
  label,
  onChange,
  placeholder,
  required,
  type = "text",
  value,
}: {
  id: string;
  label: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium" style={{ color: GELLIFY.extralight }}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="rounded-lg px-4 py-3 text-sm outline-none"
        style={{
          backgroundColor: GELLIFY.dark,
          color: "#FFFFFF",
          border: `1px solid ${GELLIFY.light}`,
        }}
      />
    </div>
  );
}

function FullPageSpinner() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: GELLIFY.darker }}
    >
      <div
        className="h-8 w-8 rounded-full border-2 animate-spin"
        style={{ borderColor: GELLIFY.primary, borderTopColor: "transparent" }}
      />
    </div>
  );
}
