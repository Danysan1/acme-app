import ChangeEmailConfirmationEmail from "@/emails/change-email-confirmation-email";
import DeleteAccountVerificationEmail from "@/emails/delete-account-verification-email";
import EmailVerificationEmail from "@/emails/email-verification-email";
import OrganizationInvitationEmail from "@/emails/organization-invitation-email";
import ResetPasswordEmail from "@/emails/reset-password-email";
import RetroRecapEmail from "@/emails/retro-recap-email";
import { logger } from "@/libs/logger/logger";
import { resend } from "@/libs/resend";
import type {
  DB_RetroActionItem,
  DB_RetroFeedbackCard,
  DB_RetroParticipant,
  DB_RetroSession,
} from "@/server/db/schema/retro";

type ResetPasswordEmailParams = {
  user: { email: string };
  url: string;
};

export const sendResetPasswordEmail = async ({
  user,
  url,
}: ResetPasswordEmailParams) => {
  logger.debug(`Click the link to reset your password: ${url}`);

  return await resend.emails.send({
    from: "Acme <noreply@acme.gellify.dev>",
    to: user.email,
    subject: "Reset password",
    react: ResetPasswordEmail({
      username: user.email,
      resetLink: url,
    }),
  });
};

type ChangeEmailConfirmationParams = {
  user: { email: string; name: string };
  url: string;
  newEmail: string;
};

export const sendChangeEmailConfirmationEmail = async ({
  newEmail,
  url,
  user,
}: ChangeEmailConfirmationParams) => {
  logger.debug(`Click the link to approve email change: ${url}`);

  await resend.emails.send({
    from: "Acme <noreply@acme.gellify.dev>",
    to: user.email,
    subject: "Confirm email change",
    react: ChangeEmailConfirmationEmail({
      user,
      newEmail,
      url,
    }),
  });
};

type EmailVerificationEmailParams = {
  user: { email: string; name: string };
  url: string;
};

export const sendEmailVerificationEmail = async ({
  url,
  user,
}: EmailVerificationEmailParams) => {
  logger.debug(`Click the link to verify your email: ${url}`);

  await resend.emails.send({
    from: "Acme <noreply@acme.gellify.dev>",
    to: user.email,
    subject: "Verify your email address",
    react: EmailVerificationEmail({
      user,
      url,
    }),
  });
};

type DeleteAccountVerificationParams = {
  user: { email: string; name: string };
  url: string;
};

export const sendDeleteAccountVerificationEmail = async ({
  user,
  url,
}: DeleteAccountVerificationParams) => {
  logger.debug(`Click the link to delete the account: ${url}`);

  await resend.emails.send({
    from: "Acme <noreply@acme.gellify.dev>",
    to: user.email,
    subject: "Delete account",
    react: DeleteAccountVerificationEmail({
      user,
      url,
    }),
  });
};

type OrganizationInvitationEmailParams = {
  email: string;
  invitedByUsername: string;
  invitedByEmail: string;
  teamName: string;
  inviteLink: string;
};

export const sendOrganizationInvitationEmail = async ({
  inviteLink,
  email,
  invitedByUsername,
  invitedByEmail,
  teamName,
}: OrganizationInvitationEmailParams) => {
  logger.debug(`Click the link to accept invitation: ${inviteLink}`);

  await resend.emails.send({
    from: "Acme <noreply@acme.gellify.dev>",
    to: email,
    subject: `You're invited to join ${teamName} on Acme`,
    react: OrganizationInvitationEmail({
      inviteLink,
      invitedByUsername,
      invitedByEmail,
      teamName,
    }),
  });
};

type RetroRecapEmailParams = {
  participants: DB_RetroParticipant[];
  session: DB_RetroSession;
  cards: DB_RetroFeedbackCard[];
  actionItems: DB_RetroActionItem[];
};

export const sendRetroRecapEmail = async ({
  participants,
  session,
  cards,
  actionItems,
}: RetroRecapEmailParams) => {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const wellCards = cards.filter((c) => c.column === "well");
  const improveCards = cards.filter((c) => c.column === "improve");
  const questionsCards = cards.filter((c) => c.column === "questions");

  await Promise.all(
    participants.map((participant) =>
      resend.emails.send({
        from: "Agile Retro <noreply@acme.gellify.dev>",
        to: participant.email,
        subject: `Retro recap – ${session.sprintName} – ${date}`,
        react: RetroRecapEmail({
          participantName: participant.displayName,
          session,
          date,
          actionItems,
          wellCards,
          improveCards,
          questionsCards,
        }),
      }),
    ),
  );
};
