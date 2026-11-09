import type { Metadata } from "next";
import LegalPage, { ContactLine, type LegalSection } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy policy | LocalMart",
  description: "What LocalMart collects, why, who sees it, and the choices you have.",
};

const sections: LegalSection[] = [
  {
    title: "What we collect",
    body: [
      <p key="a">We collect only what is needed to show you shops, take your orders and keep the app safe.</p>,
      <ul key="b">
        <li>
          <strong>Your account:</strong> your name, your email or mobile number, and your password (kept by our sign-in provider; we cannot read it).
          If you sign in with Google, we get your name and email from Google.
        </li>
        <li>
          <strong>Your orders:</strong> the items, your delivery address and phone number, how you pay (cash or UPI) and the order&apos;s progress.
        </li>
        <li>
          <strong>What you send:</strong> chat messages, reviews and photos, requests to book a visit or keep an item aside.
        </li>
        <li>
          <strong>Your location:</strong> only when you tap “Use my location” or choose an area or PIN code. We use it to show shops near you.
        </li>
        <li>
          <strong>Your phone or computer:</strong> a notification token if you turn alerts on; small files (cookies and local storage) that keep you
          signed in and remember your cart, your area and what you looked at recently; simple counts such as how often a shop page is opened or its
          WhatsApp or call button is tapped (counted without your name).
        </li>
        <li>
          <strong>If you own a shop:</strong> the shop&apos;s name, address, map pin, photos, items, opening hours, contact numbers and the UPI ID you
          choose to show to buyers.
        </li>
      </ul>,
    ],
  },
  {
    title: "How we use it",
    body: [
      <ul key="a">
        <li>To run LocalMart: show shops and items, take and pass on orders, let you chat with shops, and send you order updates.</li>
        <li>To keep everyone safe: we may read chats and reports to stop fraud, abuse and fake orders.</li>
        <li>To help you and the shops: answer questions, fix problems, and show shop owners simple reports such as which link brought an order.</li>
        <li>To make LocalMart better, using counts and trends rather than your name.</li>
      </ul>,
    ],
  },
  {
    title: "Who sees it",
    body: [
      <p key="a">
        <strong>The shop you deal with.</strong> When you place an order, send a message or book a visit, that shop sees your name, phone number,
        delivery address and what you asked for, so it can serve you. Other shops do not see them.
      </p>,
      <p key="b">
        <strong>Other shoppers</strong> see your name next to a review you post, and nothing else about you.
      </p>,
      <p key="c">
        <strong>We do not sell your personal information</strong> and we do not share it with advertisers.
      </p>,
      <p key="d">
        <strong>Services that help us run LocalMart</strong> handle data only on our behalf: sign-in and database hosting (Supabase), website and
        server hosting, email sending, shop alerts through browser notifications and Telegram, map pictures (OpenStreetMap), and payments for shop
        ads and plans (Razorpay).
      </p>,
      <p key="e">We may share information when the law requires it, or to protect people from harm.</p>,
    ],
  },
  {
    title: "Payments",
    body: [
      <p key="a">
        Orders are paid directly to the shop, by cash on delivery or by UPI to the shop&apos;s own UPI ID. LocalMart does not collect or store your
        card or UPI details for orders. Shops pay LocalMart for optional extras such as ads and plans; those payments go through our payment
        provider.
      </p>,
    ],
  },
  {
    title: "How long we keep it",
    body: [
      <p key="a">
        We keep your information while your account is open. Orders and reviews are kept as records for the shop and for you. If you ask us to delete
        your account we will, except for what we must keep for fraud, disputes or the law.
      </p>,
    ],
  },
  {
    title: "Your choices",
    body: [
      <ul key="a">
        <li>Change your name, phone and addresses in your profile.</li>
        <li>Turn notifications off in your phone or browser settings, and say no when the app asks for your location.</li>
        <li>Sign out any time. Clear your browser&apos;s data to remove what LocalMart keeps on that device.</li>
        <li>Ask us for a copy of your information, to correct it, or to delete your account.</li>
      </ul>,
      <ContactLine key="b" what="To ask, write to us at" />,
    ],
  },
  {
    title: "Keeping it safe",
    body: [
      <p key="a">
        LocalMart works over secure (HTTPS) connections, passwords are looked after by our sign-in provider, and what shop owners and staff can see is
        limited by their role. No system is perfectly safe, so please keep your password private and never share an OTP or bank PIN with anyone,
        including in chat.
      </p>,
    ],
  },
  {
    title: "Children",
    body: [
      <p key="a">LocalMart is for people aged 18 and over. Younger people should use it only with a parent or guardian.</p>,
    ],
  },
  {
    title: "Changes to this page",
    body: [
      <p key="a">
        If we change this policy we will update the date above, and tell you in the app when the change matters to you.
      </p>,
    ],
  },
  {
    title: "Contact us",
    body: [<ContactLine key="a" what="Questions about your privacy? Write to us at" />],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      hindi="गोपनीयता नीति · हम आपकी जानकारी बेचते नहीं हैं"
      updated="10 November 2026"
      intro="LocalMart connects shoppers with shops in their town. This page explains, in plain words, what we collect, why we collect it, who sees it, and what you can do about it."
      sections={sections}
    />
  );
}
