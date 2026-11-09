import type { Metadata } from "next";
import LegalPage, { ContactLine, type LegalSection } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of use | LocalMart",
  description: "The rules for using LocalMart as a shopper or a shop owner.",
};

const sections: LegalSection[] = [
  {
    title: "What LocalMart is",
    body: [
      <p key="a">
        LocalMart is a platform that connects shoppers with independent shops in their town. <strong>The shop is the seller.</strong> When you order, the
        sale is between you and the shop. LocalMart does not own, stock, price, pack or deliver the items, and is not a party to the sale.
      </p>,
    ],
  },
  {
    title: "Your account",
    body: [
      <ul key="a">
        <li>Give true information, and keep your password private. What happens on your account is your responsibility.</li>
        <li>One person, one account. You must be 18 or over, or use LocalMart with a parent or guardian.</li>
        <li>We may pause or close an account that breaks these terms or harms others.</li>
      </ul>,
    ],
  },
  {
    title: "For shoppers",
    body: [
      <ul key="a">
        <li>
          Prices, stock, delivery and delivery charges are set by each shop. A shop can decline or cancel an order, for example when something is
          out of stock. If a shop does not answer a new order in time, the order is cancelled and nothing is charged.
        </li>
        <li>
          You pay the shop directly, by cash on delivery or UPI to the shop&apos;s own UPI ID. Please do not pay anyone who asks you to move away from
          LocalMart or to share an OTP or PIN.
        </li>
        <li>
          Returns and exchanges follow the shop&apos;s own policy, shown on its page. If you have a problem, talk to the shop first through the
          chat. If it is not solved, tell us.
        </li>
        <li>
          Items a shop keeps aside for you, and visit times you book, are arrangements with the shop. A shop may release them if you do not come.
        </li>
        <li>
          If cash orders are refused at the door more than once in a short time, we may ask you to pay by UPI in advance on later orders.
        </li>
      </ul>,
    ],
  },
  {
    title: "For shop owners",
    body: [
      <ul key="a">
        <li>Show true items, prices, photos, address and opening hours. Do not list anything illegal, stolen, fake or unsafe.</li>
        <li>Answer new orders within the time the app shows, keep the orders you accept, and deliver what you promised.</li>
        <li>Follow the laws that apply to your business, such as tax and any licence your goods need.</li>
        <li>
          Opening a shop is free to start. Paid extras, such as ads and plans, are priced in the app when you buy them. Prices and what a plan includes
          can change, and a change does not affect what you have already paid for.
        </li>
        <li>
          You keep the rights to the photos and words you upload. You allow LocalMart to show them on the platform and in the share cards and links made
          for your shop.
        </li>
      </ul>,
    ],
  },
  {
    title: "Messages, reviews and photos",
    body: [
      <p key="a">
        Be honest and polite. No abuse, threats, spam, private details of other people, or anything that breaks the law. We may remove content that
        does, and we may read chats and reports to keep everyone safe. Reviews should come from real experience with the shop.
      </p>,
    ],
  },
  {
    title: "What you must not do",
    body: [
      <ul key="a">
        <li>Create fake accounts, fake orders or fake reviews.</li>
        <li>Misuse order links, discount codes or offers, or try to get around how LocalMart works.</li>
        <li>Collect other people&apos;s information, copy the site automatically, or interfere with its working.</li>
      </ul>,
    ],
  },
  {
    title: "Our responsibility",
    body: [
      <p key="a">
        We work to keep LocalMart running and accurate, but we provide it “as is” and cannot promise it will never be interrupted or free of mistakes.
        We are not responsible for what a shop sells, the quality or safety of items, delivery, or how a shop treats you. To the extent the law allows,
        our responsibility to you is limited to the amount, if any, you paid LocalMart in the last 12 months. Nothing here limits rights you have
        under consumer law.
      </p>,
    ],
  },
  {
    title: "Changes",
    body: [
      <p key="a">
        We may update these terms as LocalMart grows. We will change the date above and tell you in the app about changes that matter. If you keep
        using LocalMart after a change, you accept it.
      </p>,
    ],
  },
  {
    title: "Law",
    body: [<p key="a">These terms are governed by the laws of India.</p>],
  },
  {
    title: "Contact us",
    body: [<ContactLine key="a" what="Questions about these terms? Write to us at" />],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of use"
      hindi="उपयोग की शर्तें · खरीदारी सीधे दुकान और आपके बीच होती है"
      updated="10 November 2026"
      intro="These are the rules for using LocalMart, as a shopper or as a shop owner. By creating an account or placing an order you agree to them. They are written to be read, so please do."
      sections={sections}
    />
  );
}
