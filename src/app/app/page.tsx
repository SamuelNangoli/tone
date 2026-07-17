import { WriteWorkspace } from "@/components/write-workspace";

export default async function WritePage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string }>;
}) {
  const { draft } = await searchParams;
  return <WriteWorkspace draftParam={draft ?? null} />;
}
