"server-only";

import { TRPCError } from "@trpc/server";
import type * as z from "zod";
import type { DBClient } from "@/server/db";
import type {
  addActionItemSchema,
  addCardSchema,
  createSessionSchema,
  deleteActionItemSchema,
  deleteCardSchema,
  facilitatorActionSchema,
  getSessionSchema,
  joinSessionSchema,
  submitCardsSchema,
  updateCardSchema,
  voteCardSchema,
} from "@/shared/validators/retro.schema";
import {
  createActionItemMutation,
  createCardMutation,
  createParticipantMutation,
  createSessionMutation,
  deleteActionItemMutation,
  deleteCardMutation,
  incrementVoteMutation,
  submitCardsMutation,
  updateCardMutation,
  updateSessionStatusMutation,
} from "./mutations";
import {
  getActionItemsBySessionIdQuery,
  getCardsBySessionIdQuery,
  getParticipantsBySessionIdQuery,
  getSessionByCodeQuery,
} from "./queries";

// Generates a random 6-char uppercase alphanumeric code.
// MVP: collision probability is acceptable for hackathon scale (no distributed uniqueness enforcement).
function generateSessionCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function generateFacilitatorToken(): string {
  return crypto.randomUUID();
}

export async function createSession(
  db: DBClient,
  input: z.infer<typeof createSessionSchema>,
) {
  const code = generateSessionCode();
  const facilitatorToken = generateFacilitatorToken();
  const session = await createSessionMutation(db, {
    sprintName: input.sprintName,
    facilitatorToken,
    code,
  });
  // Return the facilitatorToken only at creation time — it will never be returned again
  return { sessionId: session.id, code, facilitatorToken };
}

export async function joinSession(
  db: DBClient,
  input: z.infer<typeof joinSessionSchema>,
) {
  const session = await getSessionByCodeQuery(db, input.code);
  if (!session) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
  }
  if (session.status === "closed") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Session is closed" });
  }

  const existing = await getParticipantsBySessionIdQuery(db, session.id);
  if (existing.some((p) => p.displayName.toLowerCase() === input.displayName.toLowerCase())) {
    throw new TRPCError({ code: "CONFLICT", message: "Name already in use" });
  }

  const participant = await createParticipantMutation(db, {
    sessionId: session.id,
    displayName: input.displayName,
    email: input.email,
  });

  return {
    participantId: participant.id,
    sessionId: session.id,
    sprintName: session.sprintName,
    status: session.status,
  };
}

export async function getSession(
  db: DBClient,
  input: z.infer<typeof getSessionSchema>,
) {
  const session = await getSessionByCodeQuery(db, input.code);
  if (!session) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
  }

  const isFacilitator =
    !!input.facilitatorToken &&
    input.facilitatorToken === session.facilitatorToken;

  const participants = await getParticipantsBySessionIdQuery(db, session.id);
  const allCards = await getCardsBySessionIdQuery(db, session.id);
  const actionItems = await getActionItemsBySessionIdQuery(db, session.id);

  // In the collecting phase, each participant sees only their own cards.
  // The facilitator sees all cards (to track submission counts, not content).
  // From discussing onwards, all cards are visible to everyone (no author attribution).
  let visibleCards: typeof allCards;
  if (session.status === "collecting") {
    if (isFacilitator) {
      visibleCards = [];
    } else {
      visibleCards = allCards.filter(
        (c) => c.participantId === input.participantId,
      );
    }
  } else {
    visibleCards = allCards;
  }

  // Strip participantId from the response — cards are always anonymous to consumers
  const cards = visibleCards.map(({ participantId: _pid, ...card }) => card);

  return {
    session: {
      id: session.id,
      code: session.code,
      sprintName: session.sprintName,
      status: session.status,
      createdAt: session.createdAt,
    },
    participants,
    cards,
    actionItems,
    isFacilitator,
  };
}

export async function startSession(
  db: DBClient,
  input: z.infer<typeof facilitatorActionSchema>,
) {
  const session = await getSessionByCodeQuery(db, input.code);
  if (!session) throw new TRPCError({ code: "NOT_FOUND" });
  if (session.facilitatorToken !== input.facilitatorToken) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (session.status !== "waiting") {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Session already started",
    });
  }
  return updateSessionStatusMutation(db, session.id, "collecting");
}

export async function revealCards(
  db: DBClient,
  input: z.infer<typeof facilitatorActionSchema>,
) {
  const session = await getSessionByCodeQuery(db, input.code);
  if (!session) throw new TRPCError({ code: "NOT_FOUND" });
  if (session.facilitatorToken !== input.facilitatorToken) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (session.status !== "collecting") {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Cannot reveal in current phase",
    });
  }
  return updateSessionStatusMutation(db, session.id, "discussing");
}

export async function advanceToActions(
  db: DBClient,
  input: z.infer<typeof facilitatorActionSchema>,
) {
  const session = await getSessionByCodeQuery(db, input.code);
  if (!session) throw new TRPCError({ code: "NOT_FOUND" });
  if (session.facilitatorToken !== input.facilitatorToken) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (session.status !== "discussing") {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Cannot advance in current phase",
    });
  }
  return updateSessionStatusMutation(db, session.id, "actions");
}

export async function addCard(
  db: DBClient,
  input: z.infer<typeof addCardSchema>,
) {
  const session = await getSessionByCodeQuery(db, input.code);
  if (!session) throw new TRPCError({ code: "NOT_FOUND" });
  if (session.status !== "collecting") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Cards can only be added during collection phase",
    });
  }
  return createCardMutation(db, {
    sessionId: session.id,
    participantId: input.participantId,
    column: input.column,
    text: input.text,
  });
}

export async function updateCard(
  db: DBClient,
  input: z.infer<typeof updateCardSchema>,
) {
  const session = await getSessionByCodeQuery(db, input.code);
  if (!session) throw new TRPCError({ code: "NOT_FOUND" });
  if (session.status !== "collecting") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Cards can only be edited during collection phase",
    });
  }
  return updateCardMutation(db, {
    cardId: input.cardId,
    participantId: input.participantId,
    text: input.text,
  });
}

export async function deleteCard(
  db: DBClient,
  input: z.infer<typeof deleteCardSchema>,
) {
  const session = await getSessionByCodeQuery(db, input.code);
  if (!session) throw new TRPCError({ code: "NOT_FOUND" });
  if (session.status !== "collecting") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Cards can only be deleted during collection phase",
    });
  }
  return deleteCardMutation(db, {
    cardId: input.cardId,
    participantId: input.participantId,
  });
}

export async function submitCards(
  db: DBClient,
  input: z.infer<typeof submitCardsSchema>,
) {
  const session = await getSessionByCodeQuery(db, input.code);
  if (!session) throw new TRPCError({ code: "NOT_FOUND" });
  if (session.status !== "collecting") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return submitCardsMutation(db, input.participantId);
}

export async function voteCard(
  db: DBClient,
  input: z.infer<typeof voteCardSchema>,
) {
  // MVP: no per-participant vote tracking — same participant can vote multiple times
  return incrementVoteMutation(db, input.cardId);
}

export async function addActionItem(
  db: DBClient,
  input: z.infer<typeof addActionItemSchema>,
) {
  const session = await getSessionByCodeQuery(db, input.code);
  if (!session) throw new TRPCError({ code: "NOT_FOUND" });
  if (session.facilitatorToken !== input.facilitatorToken) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (session.status !== "actions") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Actions can only be added during actions phase",
    });
  }
  return createActionItemMutation(db, {
    sessionId: session.id,
    title: input.title,
    ownerName: input.ownerName,
  });
}

export async function deleteActionItem(
  db: DBClient,
  input: z.infer<typeof deleteActionItemSchema>,
) {
  const session = await getSessionByCodeQuery(db, input.code);
  if (!session) throw new TRPCError({ code: "NOT_FOUND" });
  if (session.facilitatorToken !== input.facilitatorToken) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return deleteActionItemMutation(db, {
    actionItemId: input.actionItemId,
    sessionId: session.id,
  });
}

export async function closeSession(
  db: DBClient,
  input: z.infer<typeof facilitatorActionSchema>,
) {
  const session = await getSessionByCodeQuery(db, input.code);
  if (!session) throw new TRPCError({ code: "NOT_FOUND" });
  if (session.facilitatorToken !== input.facilitatorToken) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (session.status !== "actions") {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Can only close in actions phase",
    });
  }

  const [participants, cards, actionItems] = await Promise.all([
    getParticipantsBySessionIdQuery(db, session.id),
    getCardsBySessionIdQuery(db, session.id),
    getActionItemsBySessionIdQuery(db, session.id),
  ]);

  await updateSessionStatusMutation(db, session.id, "closed");

  return {
    session: { ...session, status: "closed" as const },
    participants,
    cards,
    actionItems,
  };
}
