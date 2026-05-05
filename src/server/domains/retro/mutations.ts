"server-only";

import { and, eq, sql } from "drizzle-orm";
import type { DBClient } from "@/server/db";
import {
  type DB_RetroSession,
  retroActionItemTable,
  retroFeedbackCardTable,
  retroParticipantTable,
  retroSessionTable,
} from "@/server/db/schema/retro";

export async function createSessionMutation(
  db: DBClient,
  params: {
    sprintName: string;
    facilitatorToken: string;
    code: string;
  },
) {
  const [session] = await db
    .insert(retroSessionTable)
    .values(params)
    .returning();
  if (!session) throw new Error("Failed to create session");
  return session;
}

export async function updateSessionStatusMutation(
  db: DBClient,
  sessionId: string,
  status: DB_RetroSession["status"],
) {
  const [session] = await db
    .update(retroSessionTable)
    .set({ status })
    .where(eq(retroSessionTable.id, sessionId))
    .returning();
  return session;
}

export async function createParticipantMutation(
  db: DBClient,
  params: {
    sessionId: string;
    displayName: string;
    email: string;
  },
) {
  const [participant] = await db
    .insert(retroParticipantTable)
    .values(params)
    .returning();
  if (!participant) throw new Error("Failed to create participant");
  return participant;
}

export async function createCardMutation(
  db: DBClient,
  params: {
    sessionId: string;
    participantId: string;
    column: "well" | "improve" | "questions";
    text: string;
  },
) {
  const [card] = await db
    .insert(retroFeedbackCardTable)
    .values(params)
    .returning();
  if (!card) throw new Error("Failed to create card");
  return card;
}

export async function updateCardMutation(
  db: DBClient,
  params: { cardId: string; participantId: string; text: string },
) {
  const [card] = await db
    .update(retroFeedbackCardTable)
    .set({ text: params.text })
    .where(
      and(
        eq(retroFeedbackCardTable.id, params.cardId),
        eq(retroFeedbackCardTable.participantId, params.participantId),
      ),
    )
    .returning();
  return card;
}

export async function deleteCardMutation(
  db: DBClient,
  params: { cardId: string; participantId: string },
) {
  const [card] = await db
    .delete(retroFeedbackCardTable)
    .where(
      and(
        eq(retroFeedbackCardTable.id, params.cardId),
        eq(retroFeedbackCardTable.participantId, params.participantId),
      ),
    )
    .returning();
  return card;
}

export async function submitCardsMutation(db: DBClient, participantId: string) {
  const [participant] = await db
    .update(retroParticipantTable)
    .set({ submitted: true })
    .where(eq(retroParticipantTable.id, participantId))
    .returning();
  return participant;
}

export async function incrementVoteMutation(db: DBClient, cardId: string) {
  const [card] = await db
    .update(retroFeedbackCardTable)
    .set({ voteCount: sql`${retroFeedbackCardTable.voteCount} + 1` })
    .where(eq(retroFeedbackCardTable.id, cardId))
    .returning();
  return card;
}

export async function createActionItemMutation(
  db: DBClient,
  params: { sessionId: string; title: string; ownerName: string },
) {
  const [item] = await db
    .insert(retroActionItemTable)
    .values(params)
    .returning();
  if (!item) throw new Error("Failed to create action item");
  return item;
}

export async function deleteActionItemMutation(
  db: DBClient,
  params: { actionItemId: string; sessionId: string },
) {
  const [item] = await db
    .delete(retroActionItemTable)
    .where(
      and(
        eq(retroActionItemTable.id, params.actionItemId),
        eq(retroActionItemTable.sessionId, params.sessionId),
      ),
    )
    .returning();
  return item;
}
