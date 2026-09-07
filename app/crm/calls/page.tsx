import { LeadList } from "../LeadList";

export const metadata = { title: "Cold calls" };

export default function ColdCallsPage() {
  return <LeadList channel="cold_call" />;
}
