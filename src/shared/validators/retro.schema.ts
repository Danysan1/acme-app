import * as z from "zod";

export const createSessionSchema = z.object({
  sprintName: z.string().min(1).max(256),
});

export const joinSessionSchema = z.object({
  code: z.string().length(6),
  displayName: z.string().min(1).max(256),
  email: z.string().email(),
});

export const sessionCodeSchema = z.object({
  code: z.string().length(6),
});

export const facilitatorActionSchema = z.object({
  code: z.string().length(6),
  // MVP: facilitatorToken is passed from localStorage — simplified auth for hackathon demo
  facilitatorToken: z.string().min(1),
});

export const addCardSchema = z.object({
  code: z.string().length(6),
  participantId: z.string().uuid(),
  column: z.enum(["well", "improve", "questions"]),
  text: z.string().min(1).max(1000),
});

export const deleteCardSchema = z.object({
  code: z.string().length(6),
  participantId: z.string().uuid(),
  cardId: z.string().uuid(),
});

export const submitCardsSchema = z.object({
  code: z.string().length(6),
  participantId: z.string().uuid(),
});

export const voteCardSchema = z.object({
  code: z.string().length(6),
  cardId: z.string().uuid(),
});

export const addActionItemSchema = z.object({
  code: z.string().length(6),
  facilitatorToken: z.string().min(1),
  title: z.string().min(1).max(512),
  ownerName: z.string().min(1).max(256),
});

export const deleteActionItemSchema = z.object({
  code: z.string().length(6),
  facilitatorToken: z.string().min(1),
  actionItemId: z.string().uuid(),
});

export const getSessionSchema = z.object({
  code: z.string().length(6),
  facilitatorToken: z.string().optional(),
  participantId: z.string().uuid().optional(),
});
