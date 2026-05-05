"server-only";

import { eq } from "drizzle-orm";
import type { DBClient } from "@/server/db";
import {
  retroActionItemTable,
  retroFeedbackCardTable,
  retroParticipantTable,
  retroSessionTable,
} from "@/server/db/schema/retro";

export async function getSessionByCodeQuery(db: DBClient, code: string) {
  const [session] = await db
    .select()
    .from(retroSessionTable)
    .where(eq(retroSessionTable.code, code));
  return session ?? null;
}

export async function getParticipantsBySessionIdQuery(
  db: DBClient,
  sessionId: string,
) {
  return db
    .select({
      id: retroParticipantTable.id,
      displayName: retroParticipantTable.displayName,
      email: retroParticipantTable.email,
      submitted: retroParticipantTable.submitted,
    })
    .from(retroParticipantTable)
    .where(eq(retroParticipantTable.sessionId, sessionId));
}

export async function getCardsBySessionIdQuery(
  db: DBClient,
  sessionId: string,
) {
  return db
    .select({
      id: retroFeedbackCardTable.id,
      column: retroFeedbackCardTable.column,
      text: retroFeedbackCardTable.text,
      voteCount: retroFeedbackCardTable.voteCount,
      participantId: retroFeedbackCardTable.participantId,
    })
    .from(retroFeedbackCardTable)
    .where(eq(retroFeedbackCardTable.sessionId, sessionId));
}

export async function getActionItemsBySessionIdQuery(
  db: DBClient,
  sessionId: string,
) {
  return db
    .select({
      id: retroActionItemTable.id,
      title: retroActionItemTable.title,
      ownerName: retroActionItemTable.ownerName,
    })
    .from(retroActionItemTable)
    .where(eq(retroActionItemTable.sessionId, sessionId));
}
