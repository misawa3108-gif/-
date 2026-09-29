import { Desk } from "@/components/desk/desk";
import { readSnapshot } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function DeskPage() {
  const snapshot = await readSnapshot();
  return <Desk initial={snapshot} />;
}
