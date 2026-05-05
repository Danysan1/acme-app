import { RetroSession } from "@/components/retro/retro-session";

type RetroSessionPageProps = {
  params: Promise<{ locale: string; code: string }>;
};

export default async function RetroSessionPage({
  params,
}: RetroSessionPageProps) {
  const { code } = await params;
  return <RetroSession code={code.toUpperCase()} />;
}
