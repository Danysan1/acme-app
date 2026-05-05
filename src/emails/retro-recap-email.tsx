import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  pixelBasedPreset,
  Tailwind,
} from "@react-email/components";
import type {
  DB_RetroActionItem,
  DB_RetroFeedbackCard,
  DB_RetroSession,
} from "@/server/db/schema/retro";

type RetroRecapEmailProps = {
  participantName: string;
  session: DB_RetroSession;
  date: string;
  actionItems: DB_RetroActionItem[];
  wellCards: DB_RetroFeedbackCard[];
  improveCards: DB_RetroFeedbackCard[];
  questionsCards: DB_RetroFeedbackCard[];
};

export default function RetroRecapEmail({
  participantName,
  session,
  date,
  actionItems,
  wellCards,
  improveCards,
  questionsCards,
}: Readonly<RetroRecapEmailProps>) {
  return (
    <Html>
      <Head />
      <Preview>
        Retro recap – {session.sprintName} – {date}
      </Preview>
      <Tailwind config={{ presets: [pixelBasedPreset] }}>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[600px]">
            <Heading className="text-[#260B32] text-[22px] font-medium text-center p-0 my-[24px] mx-0">
              Retro recap – {session.sprintName}
            </Heading>
            <Text className="text-[#331141] text-[14px] leading-[24px]">
              Hi {participantName},
            </Text>
            <Text className="text-[#331141] text-[14px] leading-[24px]">
              here is the recap of the retrospective for{" "}
              <strong>{session.sprintName}</strong> held on {date}.
            </Text>

            {actionItems.length > 0 && (
              <Section>
                <Hr className="border-[#822E7B] my-[16px]" />
                <Text className="text-[#822E7B] text-[12px] font-medium uppercase tracking-wider mb-[8px]">
                  Action Items
                </Text>
                {actionItems.map((item, i) => (
                  <Text
                    key={item.id}
                    className="text-[#331141] text-[14px] leading-[22px] my-[4px]"
                  >
                    {i + 1}. {item.title} — {item.ownerName}
                  </Text>
                ))}
              </Section>
            )}

            {wellCards.length > 0 && (
              <Section>
                <Hr className="border-[#eaeaea] my-[16px]" />
                <Text className="text-[#822E7B] text-[12px] font-medium uppercase tracking-wider mb-[8px]">
                  What Went Well
                </Text>
                {wellCards.map((card) => (
                  <Text
                    key={card.id}
                    className="text-[#331141] text-[14px] leading-[22px] my-[4px]"
                  >
                    – {card.text}
                  </Text>
                ))}
              </Section>
            )}

            {improveCards.length > 0 && (
              <Section>
                <Hr className="border-[#eaeaea] my-[16px]" />
                <Text className="text-[#822E7B] text-[12px] font-medium uppercase tracking-wider mb-[8px]">
                  Needs Improvement
                </Text>
                {improveCards.map((card) => (
                  <Text
                    key={card.id}
                    className="text-[#331141] text-[14px] leading-[22px] my-[4px]"
                  >
                    – {card.text}
                  </Text>
                ))}
              </Section>
            )}

            {questionsCards.length > 0 && (
              <Section>
                <Hr className="border-[#eaeaea] my-[16px]" />
                <Text className="text-[#822E7B] text-[12px] font-medium uppercase tracking-wider mb-[8px]">
                  Open Questions
                </Text>
                {questionsCards.map((card) => (
                  <Text
                    key={card.id}
                    className="text-[#331141] text-[14px] leading-[22px] my-[4px]"
                  >
                    – {card.text}
                  </Text>
                ))}
              </Section>
            )}

            <Hr className="border-[#eaeaea] my-[24px]" />
            <Text className="text-[#999] text-[12px] leading-[20px] text-center">
              Sent by Agile Retro Platform
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
