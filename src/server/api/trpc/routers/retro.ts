import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import * as z from "zod";
import {
  retroActionItemTable,
  retroFeedbackCardTable,
  retroParticipantTable,
  retroSessionTable,
} from "@/server/db/schema/retro";
import { sendRetroRecapEmail } from "@/server/services/email-service";
import { createTRPCRouter, publicProcedure } from "../init";

function generateSessionCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const retroRouter = createTRPCRouter({
  createSession: publicProcedure
    .input(
      z.object({
        sprintName: z.string().min(1).max(255),
        displayName: z.string().min(1).max(100),
        email: z.string().email(),
      }),
    )
    .mutation(async ({ ctx: { db }, input }) => {
      const code = generateSessionCode();
      const [session] = await db
        .insert(retroSessionTable)
        .values({ code, sprintName: input.sprintName })
        .returning();

      const [participant] = await db
        .insert(retroParticipantTable)
        .values({
          sessionId: session.id,
          displayName: input.displayName,
          email: input.email,
          isFacilitator: true,
        })
        .returning();

      return { session, participantId: participant.id };
    }),

  joinSession: publicProcedure
    .input(
      z.object({
        code: z.string().min(1).max(6),
        displayName: z.string().min(1).max(100),
        email: z.string().email(),
      }),
    )
    .mutation(async ({ ctx: { db }, input }) => {
      const session = await db.query.retroSessionTable.findFirst({
        where: eq(retroSessionTable.code, input.code.toUpperCase()),
      });

      if (!session)
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
      if (session.status === "closed")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This session has already closed",
        });

      const [participant] = await db
        .insert(retroParticipantTable)
        .values({
          sessionId: session.id,
          displayName: input.displayName,
          email: input.email,
        })
        .returning();

      return { participantId: participant.id, sessionId: session.id, code: session.code };
    }),

  getSession: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ ctx: { db }, input }) => {
      const session = await db.query.retroSessionTable.findFirst({
        where: eq(retroSessionTable.code, input.code.toUpperCase()),
      });

      if (!session) throw new TRPCError({ code: "NOT_FOUND" });

      const participants = await db.query.retroParticipantTable.findMany({
        where: eq(retroParticipantTable.sessionId, session.id),
      });

      const cards = await db.query.retroFeedbackCardTable.findMany({
        where: eq(retroFeedbackCardTable.sessionId, session.id),
        orderBy: [desc(retroFeedbackCardTable.voteCount)],
      });

      const actionItems = await db.query.retroActionItemTable.findMany({
        where: eq(retroActionItemTable.sessionId, session.id),
      });

      return { session, participants, cards, actionItems };
    }),

  startSession: publicProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        participantId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx: { db }, input }) => {
      const participant = await db.query.retroParticipantTable.findFirst({
        where: and(
          eq(retroParticipantTable.id, input.participantId),
          eq(retroParticipantTable.sessionId, input.sessionId),
        ),
      });
      if (!participant?.isFacilitator)
        throw new TRPCError({ code: "FORBIDDEN" });

      await db
        .update(retroSessionTable)
        .set({ status: "collecting" })
        .where(
          and(
            eq(retroSessionTable.id, input.sessionId),
            eq(retroSessionTable.status, "waiting"),
          ),
        );
    }),

  addCard: publicProcedure
    .input(
      z.object({
        participantId: z.string().uuid(),
        sessionId: z.string().uuid(),
        column: z.enum(["well", "improve", "questions"]),
        text: z.string().min(1).max(1000),
      }),
    )
    .mutation(async ({ ctx: { db }, input }) => {
      const [card] = await db
        .insert(retroFeedbackCardTable)
        .values({
          sessionId: input.sessionId,
          participantId: input.participantId,
          column: input.column,
          text: input.text,
        })
        .returning();
      return card;
    }),

  deleteCard: publicProcedure
    .input(
      z.object({
        cardId: z.string().uuid(),
        participantId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx: { db }, input }) => {
      await db
        .delete(retroFeedbackCardTable)
        .where(
          and(
            eq(retroFeedbackCardTable.id, input.cardId),
            eq(retroFeedbackCardTable.participantId, input.participantId),
          ),
        );
    }),

  submitCards: publicProcedure
    .input(
      z.object({
        participantId: z.string().uuid(),
        sessionId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx: { db }, input }) => {
      await db
        .update(retroParticipantTable)
        .set({ hasSubmitted: true })
        .where(
          and(
            eq(retroParticipantTable.id, input.participantId),
            eq(retroParticipantTable.sessionId, input.sessionId),
          ),
        );
    }),

  revealCards: publicProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        participantId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx: { db }, input }) => {
      const participant = await db.query.retroParticipantTable.findFirst({
        where: and(
          eq(retroParticipantTable.id, input.participantId),
          eq(retroParticipantTable.sessionId, input.sessionId),
        ),
      });
      if (!participant?.isFacilitator)
        throw new TRPCError({ code: "FORBIDDEN" });

      await db
        .update(retroSessionTable)
        .set({ status: "discussing" })
        .where(eq(retroSessionTable.id, input.sessionId));
    }),

  upvoteCard: publicProcedure
    .input(z.object({ cardId: z.string().uuid() }))
    .mutation(async ({ ctx: { db }, input }) => {
      // TODO: track per-participant votes to enforce vote limits
      await db
        .update(retroFeedbackCardTable)
        .set({ voteCount: sql`${retroFeedbackCardTable.voteCount} + 1` })
        .where(eq(retroFeedbackCardTable.id, input.cardId));
    }),

  advanceToActions: publicProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        participantId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx: { db }, input }) => {
      const participant = await db.query.retroParticipantTable.findFirst({
        where: and(
          eq(retroParticipantTable.id, input.participantId),
          eq(retroParticipantTable.sessionId, input.sessionId),
        ),
      });
      if (!participant?.isFacilitator)
        throw new TRPCError({ code: "FORBIDDEN" });

      await db
        .update(retroSessionTable)
        .set({ status: "actions" })
        .where(eq(retroSessionTable.id, input.sessionId));
    }),

  addActionItem: publicProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        participantId: z.string().uuid(),
        title: z.string().min(1).max(500),
        ownerName: z.string().min(1).max(100),
      }),
    )
    .mutation(async ({ ctx: { db }, input }) => {
      const participant = await db.query.retroParticipantTable.findFirst({
        where: and(
          eq(retroParticipantTable.id, input.participantId),
          eq(retroParticipantTable.sessionId, input.sessionId),
        ),
      });
      if (!participant?.isFacilitator)
        throw new TRPCError({ code: "FORBIDDEN" });

      const [action] = await db
        .insert(retroActionItemTable)
        .values({
          sessionId: input.sessionId,
          title: input.title,
          ownerName: input.ownerName,
        })
        .returning();
      return action;
    }),

  deleteActionItem: publicProcedure
    .input(
      z.object({
        actionId: z.string().uuid(),
        participantId: z.string().uuid(),
        sessionId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx: { db }, input }) => {
      // TODO: verify participant is facilitator of session before delete
      await db
        .delete(retroActionItemTable)
        .where(eq(retroActionItemTable.id, input.actionId));
    }),

  closeSession: publicProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        participantId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx: { db }, input }) => {
      const participant = await db.query.retroParticipantTable.findFirst({
        where: and(
          eq(retroParticipantTable.id, input.participantId),
          eq(retroParticipantTable.sessionId, input.sessionId),
        ),
      });
      if (!participant?.isFacilitator)
        throw new TRPCError({ code: "FORBIDDEN" });

      const session = await db.query.retroSessionTable.findFirst({
        where: eq(retroSessionTable.id, input.sessionId),
      });
      if (!session) throw new TRPCError({ code: "NOT_FOUND" });

      await db
        .update(retroSessionTable)
        .set({ status: "closed" })
        .where(eq(retroSessionTable.id, input.sessionId));

      const participants = await db.query.retroParticipantTable.findMany({
        where: eq(retroParticipantTable.sessionId, input.sessionId),
      });

      const cards = await db.query.retroFeedbackCardTable.findMany({
        where: eq(retroFeedbackCardTable.sessionId, input.sessionId),
        orderBy: [desc(retroFeedbackCardTable.voteCount)],
      });

      const actionItems = await db.query.retroActionItemTable.findMany({
        where: eq(retroActionItemTable.sessionId, input.sessionId),
      });

      // TODO: handle email send errors gracefully — currently throws if Resend fails
      await sendRetroRecapEmail({ participants, session, cards, actionItems });
    }),
});
