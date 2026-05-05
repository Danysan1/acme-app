import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  text,
  varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "../utils";
import { createTable } from "./_table";

export const sessionStatusEnum = pgEnum("session_status", [
  "waiting",
  "collecting",
  "discussing",
  "actions",
  "closed",
]);

export const cardColumnEnum = pgEnum("card_column", [
  "well",
  "improve",
  "questions",
]);

export const retroSessionTable = createTable(
  "retro_session",
  (d) => ({
    id: d.uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    ...timestamps,
    code: varchar("code", { length: 6 }).notNull().unique(),
    sprintName: varchar("sprint_name", { length: 256 }).notNull(),
    // MVP: facilitatorToken is a random UUID stored in the browser's localStorage.
    // This is a simplified auth mechanism for the hackathon — not a proper session/OAuth flow.
    facilitatorToken: varchar("facilitator_token", { length: 64 }).notNull(),
    status: sessionStatusEnum("status").default("waiting").notNull(),
  }),
  (t) => [index("retro_session_code_idx").on(t.code)],
);

export const retroParticipantTable = createTable(
  "retro_participant",
  (d) => ({
    id: d.uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    ...timestamps,
    sessionId: d
      .uuid("session_id")
      .references(() => retroSessionTable.id, { onDelete: "cascade" })
      .notNull(),
    displayName: varchar("display_name", { length: 256 }).notNull(),
    email: varchar("email", { length: 256 }).notNull(),
    submitted: boolean("submitted").default(false).notNull(),
  }),
  (t) => [index("retro_participant_session_idx").on(t.sessionId)],
);

export const retroFeedbackCardTable = createTable(
  "retro_feedback_card",
  (d) => ({
    id: d.uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    ...timestamps,
    sessionId: d
      .uuid("session_id")
      .references(() => retroSessionTable.id, { onDelete: "cascade" })
      .notNull(),
    participantId: d
      .uuid("participant_id")
      .references(() => retroParticipantTable.id, { onDelete: "cascade" })
      .notNull(),
    column: cardColumnEnum("column").notNull(),
    text: text("text").notNull(),
    voteCount: integer("vote_count").default(0).notNull(),
  }),
  (t) => [index("retro_card_session_idx").on(t.sessionId)],
);

export const retroActionItemTable = createTable(
  "retro_action_item",
  (d) => ({
    id: d.uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    ...timestamps,
    sessionId: d
      .uuid("session_id")
      .references(() => retroSessionTable.id, { onDelete: "cascade" })
      .notNull(),
    title: varchar("title", { length: 512 }).notNull(),
    ownerName: varchar("owner_name", { length: 256 }).notNull(),
  }),
  (t) => [index("retro_action_session_idx").on(t.sessionId)],
);

export const retroSessionRelations = relations(
  retroSessionTable,
  ({ many }) => ({
    participants: many(retroParticipantTable),
    cards: many(retroFeedbackCardTable),
    actionItems: many(retroActionItemTable),
  }),
);

export const retroParticipantRelations = relations(
  retroParticipantTable,
  ({ one, many }) => ({
    session: one(retroSessionTable, {
      fields: [retroParticipantTable.sessionId],
      references: [retroSessionTable.id],
    }),
    cards: many(retroFeedbackCardTable),
  }),
);

export const retroFeedbackCardRelations = relations(
  retroFeedbackCardTable,
  ({ one }) => ({
    session: one(retroSessionTable, {
      fields: [retroFeedbackCardTable.sessionId],
      references: [retroSessionTable.id],
    }),
    participant: one(retroParticipantTable, {
      fields: [retroFeedbackCardTable.participantId],
      references: [retroParticipantTable.id],
    }),
  }),
);

export type DB_RetroSession = typeof retroSessionTable.$inferSelect;
export type DB_RetroParticipant = typeof retroParticipantTable.$inferSelect;
export type DB_RetroFeedbackCard = typeof retroFeedbackCardTable.$inferSelect;
export type DB_RetroActionItem = typeof retroActionItemTable.$inferSelect;
