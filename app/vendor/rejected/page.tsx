import { getCurrentUser } from "@/src/shared/utils/auth";
import { XCircle } from "lucide-react";
import { Button } from "@/components/app/ui";
import { MessageCard } from "@/components/app/seller";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
// Set NEXT_PUBLIC_SUPPORT_EMAIL to LocalMart's real support address; the
// help line stays hidden until then
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "";

async function getVendorRequestStatus(email: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/vendor-requests/status?email=${encodeURIComponent(email)}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error("Error fetching vendor request status:", error);
    return null;
  }
}

const TIPS = [
  "Use your real shop name",
  "Give the full address with a landmark",
  "Say clearly what you sell",
];

export default async function VendorRejectedPage() {
  const user = await getCurrentUser();

  let rejectionReason = null;
  if (user?.email) {
    const requestStatus = await getVendorRequestStatus(user.email);
    if (requestStatus?.status === 'REJECTED') {
      rejectionReason = requestStatus.rejectionReason;
    }
  }

  return (
    <MessageCard
      icon={<XCircle className="h-8 w-8" aria-hidden />}
      title="Your shop was not approved"
      body="Don't worry — fix your details and apply again."
    >
      {rejectionReason && (
        <div className="rounded-2xl bg-bad-soft p-4 text-left">
          <p className="text-[14px] font-semibold text-bad">Reason from LocalMart</p>
          <p className="mt-0.5 text-[15px] leading-snug text-label">{rejectionReason}</p>
        </div>
      )}
      <div className="rounded-2xl bg-fill p-4 text-left">
        <p className="text-[15px] font-semibold text-label">Before you apply again</p>
        <ul className="mt-2 space-y-1.5 text-[15px] leading-snug text-label-2">
          {TIPS.map((tip) => (
            <li key={tip} className="flex gap-2">
              <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-label-3" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
      <Button href="/become-vendor" full>
        Apply again
      </Button>
      <Button href="/" variant="secondary" full>
        Go to home
      </Button>
      {SUPPORT_EMAIL && (
      <p className="pt-2 text-[14px] text-label-2">
        Need help? Write to{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-tint">
          {SUPPORT_EMAIL}
        </a>
      </p>
      )}
    </MessageCard>
  );
}
