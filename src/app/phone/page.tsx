import { Handset } from "@/components/phone/handset";
import { readSnapshot } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function PhonePage() {
  const snapshot = await readSnapshot();
  return <Handset initial={snapshot} />;
}
