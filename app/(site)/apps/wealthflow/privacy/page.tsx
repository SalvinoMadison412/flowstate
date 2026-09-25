import type { Metadata } from "next";
import { DocPage } from "@/components/sections/DocPage";

export const metadata: Metadata = {
  title: "WealthFlow Privacy Policy",
  description: "How the WealthFlow app handles your data: statements stay on your phone.",
  alternates: { canonical: "/apps/wealthflow/privacy" },
};

const EMAIL = "salvinokevin7@gmail.com";

export default function WealthFlowPrivacy() {
  return (
    <DocPage label="WealthFlow" title="WealthFlow Privacy Policy" updated="26 September 2026">
      <p>
        WealthFlow (&ldquo;the app&rdquo;, &ldquo;we&rdquo;) is a personal finance app for Android,
        operated by Salvino Madison, an individual developer. Contact:{" "}
        <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
      </p>

      <h2>What stays on your phone</h2>
      <p>
        Your bank statement PDFs, the transactions read from them, your bank accounts, budgets and
        insights are processed and stored <strong>only on your device</strong>. They are not
        uploaded to us or anyone else. No AI or machine-learning service reads them: transactions
        are sorted by fixed rules, on your device. If you delete the app or switch phones, this
        data is gone; importing your statements again restores it.
      </p>

      <h2>What we store on our servers</h2>
      <p>When you sign in we keep:</p>
      <ul>
        <li><strong>Sign-in details</strong> from Google: your account identifier and email address.</li>
        <li>
          <strong>Your profile</strong>, as you enter it: name, email, phone number, age range,
          monthly income range, main goal and occupation.
        </li>
        <li>
          <strong>Your categories and rules</strong>: category names, colours and monthly budgets,
          and the merchant patterns and amount thresholds you write to sort transactions.
        </li>
      </ul>
      <p>
        This is stored with our backend provider, Supabase, in India (Mumbai region). Each user can
        read and change only their own records.
      </p>

      <h2>How we use it</h2>
      <p>
        To sign you in, personalise the app, and restore your categories and rules on a new phone.
        We do not sell your data, share it for advertising, or use it for analytics. The app
        contains no advertising, analytics or crash-reporting tools.
      </p>

      <h2>Who else is involved</h2>
      <ul>
        <li><strong>Google</strong>, for sign-in (subject to Google&apos;s privacy policy).</li>
        <li><strong>Supabase</strong>, which hosts the account database on our behalf.</li>
      </ul>
      <p>We do not share your data with anyone else, unless required by law.</p>

      <h2>Your choices</h2>
      <ul>
        <li>Edit your profile at any time in the app (Menu &gt; Profile).</li>
        <li>
          <strong>Wipe all data</strong> (Menu &gt; Profile) removes everything on your phone and
          your synced rules, but keeps your account.
        </li>
        <li>
          <strong>Delete account</strong> (Menu &gt; Profile) removes your account, as described
          below.
        </li>
      </ul>

      <h2>Deleting your account</h2>
      <p>
        In the app, go to Menu &gt; Profile &gt; <strong>Delete account</strong>, type DELETE and
        confirm. This immediately and permanently removes your account, profile, categories and
        rules from our servers, and everything stored on your device.
      </p>
      <p>
        If you can&apos;t open the app, email <a href={`mailto:${EMAIL}`}>{EMAIL}</a> from the
        address on your account with the subject &ldquo;Delete my WealthFlow account&rdquo;. We will
        delete the server data within 30 days and confirm by reply. Uninstalling the app removes
        the data on that phone. Full steps: <a href="/apps/wealthflow/delete-account">delete your account</a>.
      </p>
      <p>We keep server data only until you delete your account.</p>

      <h2>Security</h2>
      <p>
        Data is sent over encrypted connections (HTTPS). Access to server data is restricted so
        each user can reach only their own records.
      </p>

      <h2>Children</h2>
      <p>WealthFlow is for adults (18+). We do not knowingly collect data from children.</p>

      <h2>Changes</h2>
      <p>We will post changes on this page and update the date above.</p>

      <h2>Contact</h2>
      <p>Salvino Madison, <a href={`mailto:${EMAIL}`}>{EMAIL}</a></p>
    </DocPage>
  );
}
