import { SessionRoom } from "@/components/retro/session-room";

export default async function RetroSessionPage({
  params,
}: {
  params: Promise<{ code: string; locale: string }>;
}) {
  const { code } = await params;
  return <SessionRoom code={code.toUpperCase()} />;
}
