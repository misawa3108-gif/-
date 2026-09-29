import { Kiosk } from "@/components/lobby/kiosk";
import { readSnapshot } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const snapshot = await readSnapshot();
  return <Kiosk initial={snapshot} />;
}
