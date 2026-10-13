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
    <DocPage label="WealthFlow" title="WealthFlow Privacy Policy" updated="13 October 2026">
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
        <li>
          <strong>Sign-in details</strong> from Google: your account identifier, email address,
          display name and profile picture link.
        </li>
        <li>
          <strong>Sign-in logs</strong>: the IP address and time of each sign-in, kept by our
          backend provider to keep accounts secure.
        </li>
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

      <h2>Your rights</h2>
      <p>
        We hold your account data because you agreed to it by signing in and filling in your
        profile. You can:
      </p>
      <ul>
        <li>
          <strong>See and correct it</strong>: your profile, categories and rules are shown in the
          app and can be edited there. For a copy of everything we hold, email us.
        </li>
        <li>
          <strong>Erase it</strong>: use Delete account, or email us.
        </li>
        <li>
          <strong>Withdraw your consent</strong> at any time by deleting your account. The app
          needs an account to work, so this ends your use of it.
        </li>
      </ul>
      <p>
        <strong>Complaints</strong>: email Salvino Madison at <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
        We reply within 30 days. If you are in India and are not satisfied with the reply, you can
        complain to the Data Protection Board of India.
      </p>

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
      <p>
        WealthFlow is for people aged 13 and over. It is not directed at children under 13, and we
        do not knowingly collect data from them. If you are under 18, use WealthFlow only with the
        permission and help of a parent or guardian. A parent or guardian can delete a child&apos;s
        account and data at any time with Delete account in the app, or by emailing{" "}
        <a href={`mailto:${EMAIL}`}>{EMAIL}</a>. If you believe a child under 13 has an account,
        email us and we will delete it.
      </p>

      <h2>Changes</h2>
      <p>We will post changes on this page and update the date above.</p>

      <h2>Contact</h2>
      <p>Salvino Madison, <a href={`mailto:${EMAIL}`}>{EMAIL}</a></p>
    </DocPage>
  );
}
