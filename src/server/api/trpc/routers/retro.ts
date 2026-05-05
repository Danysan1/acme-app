import {
  addActionItem,
  addCard,
  advanceToActions,
  closeSession,
  createSession,
  deleteActionItem,
  deleteCard,
  getSession,
  joinSession,
  revealCards,
  startSession,
  submitCards,
  updateCard,
  voteCard,
} from "@/server/domains/retro/retro-service";
import {
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
import { createTRPCRouter, publicProcedure } from "../init";

export const retroRouter = createTRPCRouter({
  createSession: publicProcedure
    .input(createSessionSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      return createSession(db, input);
    }),

  joinSession: publicProcedure
    .input(joinSessionSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      return joinSession(db, input);
    }),

  getSession: publicProcedure
    .input(getSessionSchema)
    .query(async ({ ctx: { db }, input }) => {
      return getSession(db, input);
    }),

  startSession: publicProcedure
    .input(facilitatorActionSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      return startSession(db, input);
    }),

  revealCards: publicProcedure
    .input(facilitatorActionSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      return revealCards(db, input);
    }),

  advanceToActions: publicProcedure
    .input(facilitatorActionSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      return advanceToActions(db, input);
    }),

  addCard: publicProcedure
    .input(addCardSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      return addCard(db, input);
    }),

  updateCard: publicProcedure
    .input(updateCardSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      return updateCard(db, input);
    }),

  deleteCard: publicProcedure
    .input(deleteCardSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      return deleteCard(db, input);
    }),

  submitCards: publicProcedure
    .input(submitCardsSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      return submitCards(db, input);
    }),

  voteCard: publicProcedure
    .input(voteCardSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      return voteCard(db, input);
    }),

  addActionItem: publicProcedure
    .input(addActionItemSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      return addActionItem(db, input);
    }),

  deleteActionItem: publicProcedure
    .input(deleteActionItemSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      return deleteActionItem(db, input);
    }),

  // US-05: returns full session data so the client can build the mailto: recap link.
  // No server-side email is sent — the facilitator opens their own email client.
  closeSession: publicProcedure
    .input(facilitatorActionSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      return closeSession(db, input);
    }),
});
