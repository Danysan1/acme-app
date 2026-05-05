import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  pixelBasedPreset,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

type RetroCard = {
  column: "well" | "improve" | "questions";
  text: string;
  voteCount: number;
};

type RetroActionItem = {
  title: string;
  ownerName: string;
};

type RetroRecapEmailProps = {
  participantName: string;
  sprintName: string;
  date: string;
  actionItems: RetroActionItem[];
  cards: RetroCard[];
};

const columnLabels = {
  well: "What Went Well",
  improve: "Needs Improvement",
  questions: "Open Questions",
} as const;

export default function RetroRecapEmail({
  participantName,
  sprintName,
  date,
  actionItems,
  cards,
}: Readonly<RetroRecapEmailProps>) {
  const previewText = `Retro recap — ${sprintName} — ${date}`;

  const cardsByColumn = {
    well: cards
      .filter((c) => c.column === "well")
      .sort((a, b) => b.voteCount - a.voteCount),
    improve: cards
      .filter((c) => c.column === "improve")
      .sort((a, b) => b.voteCount - a.voteCount),
    questions: cards
      .filter((c) => c.column === "questions")
      .sort((a, b) => b.voteCount - a.voteCount),
  };

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind config={{ presets: [pixelBasedPreset] }}>
        <Body className="bg-[#F2E3F2] my-auto mx-auto font-sans px-2">
          <Container className="bg-white rounded-[8px] my-[40px] mx-auto p-[32px] max-w-[560px] border border-solid border-[#CD68C5]">
            {/* Header */}
            <Section className="bg-[#260B32] rounded-[8px] p-[24px] mb-[24px] text-center">
              <Heading className="text-white text-[22px] font-medium m-0 mb-[4px]">
                Retro Recap
              </Heading>
              <Text className="text-[#CD68C5] text-[14px] m-0">
                {sprintName} · {date}
              </Text>
            </Section>

            <Text className="text-[#331141] text-[15px] leading-[24px]">
              Hi {participantName},
            </Text>
            <Text className="text-[#331141] text-[14px] leading-[24px]">
              here is the recap of the retrospective for{" "}
              <strong>{sprintName}</strong> held on {date}.
            </Text>

            {/* Action Items */}
            {actionItems.length > 0 && (
              <Section className="mt-[24px]">
                <Heading className="text-[#822E7B] text-[16px] font-medium m-0 mb-[12px] uppercase tracking-wide">
                  Action Items
                </Heading>
                {actionItems.map((item, i) => (
                  <Text
                    key={i}
                    className="text-[#331141] text-[14px] leading-[22px] m-0 mb-[6px]"
                  >
                    {i + 1}. <strong>{item.title}</strong> — {item.ownerName}
                  </Text>
                ))}
              </Section>
            )}

            <Hr className="border border-solid border-[#F2E3F2] my-[24px]" />

            {/* Cards by column */}
            {(["well", "improve", "questions"] as const).map((col) =>
              cardsByColumn[col].length > 0 ? (
                <Section key={col} className="mb-[20px]">
                  <Heading className="text-[#822E7B] text-[16px] font-medium m-0 mb-[10px] uppercase tracking-wide">
                    {columnLabels[col]}
                  </Heading>
                  {cardsByColumn[col].map((card, i) => (
                    <Text
                      key={i}
                      className="text-[#331141] text-[14px] leading-[22px] m-0 mb-[4px]"
                    >
                      – {card.text}
                    </Text>
                  ))}
                </Section>
              ) : null,
            )}

            <Hr className="border border-solid border-[#F2E3F2] my-[20px]" />
            <Text className="text-[#A159A1] text-[12px] leading-[20px] text-center m-0">
              Sent by Agile Retro Platform · Powered by GELLIFY
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
