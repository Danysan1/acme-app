import { relations, sql } from "drizzle-orm";
import { createTable } from "./_table";
import { timestamps } from "../utils";

export const retroSessionTable = createTable("retro_session", (d) => ({
  id: d.uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
  ...timestamps,
  code: d.varchar({ length: 6 }).notNull().unique(),
  sprintName: d.varchar({ length: 255 }).notNull(),
  // status: waiting | collecting | discussing | actions | closed
  status: d.varchar({ length: 20 }).default("waiting").notNull(),
}));

export const retroParticipantTable = createTable("retro_participant", (d) => ({
  id: d.uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
  ...timestamps,
  sessionId: d
    .uuid()
    .notNull()
    .references(() => retroSessionTable.id, { onDelete: "cascade" }),
  displayName: d.varchar({ length: 100 }).notNull(),
  email: d.varchar({ length: 255 }).notNull(),
  hasSubmitted: d.boolean().default(false).notNull(),
  isFacilitator: d.boolean().default(false).notNull(),
}));

export const retroFeedbackCardTable = createTable(
  "retro_feedback_card",
  (d) => ({
    id: d.uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    ...timestamps,
    sessionId: d
      .uuid()
      .notNull()
      .references(() => retroSessionTable.id, { onDelete: "cascade" }),
    participantId: d
      .uuid()
      .notNull()
      .references(() => retroParticipantTable.id, { onDelete: "cascade" }),
    // column: well | improve | questions
    column: d.varchar({ length: 20 }).notNull(),
    text: d.text().notNull(),
    voteCount: d.integer().default(0).notNull(),
  }),
);

export const retroActionItemTable = createTable("retro_action_item", (d) => ({
  id: d.uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
  ...timestamps,
  sessionId: d
    .uuid()
    .notNull()
    .references(() => retroSessionTable.id, { onDelete: "cascade" }),
  title: d.varchar({ length: 500 }).notNull(),
  ownerName: d.varchar({ length: 100 }).notNull(),
}));

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
