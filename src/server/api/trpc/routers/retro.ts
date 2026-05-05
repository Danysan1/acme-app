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
  voteCard,
} from "@/server/domains/retro/retro-service";
import { sendRetroRecapEmail } from "@/server/services/email-service";
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

  closeSession: publicProcedure
    .input(facilitatorActionSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      const result = await closeSession(db, input);
      // Send recap email to all participants after closing
      await sendRetroRecapEmail({
        participants: result.participants,
        sprintName: result.session.sprintName,
        cards: result.cards,
        actionItems: result.actionItems,
      });
      return { success: true };
    }),
});
