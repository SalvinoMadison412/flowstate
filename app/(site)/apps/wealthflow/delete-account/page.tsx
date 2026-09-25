import type { Metadata } from "next";
import { DocPage } from "@/components/sections/DocPage";

export const metadata: Metadata = {
  title: "Delete your WealthFlow account",
  description: "How to delete your WealthFlow account and data.",
  alternates: { canonical: "/apps/wealthflow/delete-account" },
};

const EMAIL = "salvinokevin7@gmail.com";

export default function WealthFlowDelete() {
  return (
    <DocPage label="WealthFlow" title="Delete your WealthFlow account">
      <h2>In the app (fastest)</h2>
      <ol>
        <li>Open WealthFlow and go to <strong>Menu &gt; Profile</strong>.</li>
        <li>Under <strong>Account</strong>, tap <strong>Delete account</strong>.</li>
        <li>Type <strong>DELETE</strong> and confirm.</li>
      </ol>

      <h2>What is deleted</h2>
      <ul>
        <li>Your account and sign-in record.</li>
        <li>Your profile: name, email, phone, age range, income range, goal, occupation.</li>
        <li>Your synced categories and rules.</li>
        <li>Everything on the phone: statements, transactions, accounts, budgets and settings.</li>
      </ul>
      <p>
        Deletion is immediate and cannot be undone. WealthFlow keeps no backups of your statements
        or transactions, because they never left your phone.
      </p>

      <h2>If you can&apos;t open the app</h2>
      <p>
        Email <a href={`mailto:${EMAIL}`}>{EMAIL}</a> from the address on your account with the
        subject &ldquo;Delete my WealthFlow account&rdquo;. We will delete the server data within
        30 days and reply to confirm. Uninstalling the app removes the data on that phone.
      </p>
    </DocPage>
  );
}
