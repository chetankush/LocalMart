"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Store } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-provider";
import { Page } from "@/components/app/ui";
import ChatThread from "@/components/chat/ChatThread";
import { signInHref } from "@/lib/auth/returnTo";

/** A buyer's chat with a shop */
export default function BuyerChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading } = useAuth();
  const router = useRouter();
  const [attach, setAttach] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push(signInHref(`/chats/${id}`));
  }, [user, loading, router, id]);
  useEffect(() => {
    setAttach(new URLSearchParams(window.location.search).get("product"));
  }, []);

  if (!user) return null;
  return (
    <Page>
      <ChatThread
        key={`${id}:${attach ?? ""}`}
        conversationId={id}
        side="BUYER"
        attachProductId={attach}
        firstDraft={attach ? "Namaste, kya yeh available hai?" : undefined}
        header={(d) => (
          <header className="-mx-2 mb-3 flex items-center gap-2 border-b border-hairline pb-2">
            <Link href="/chats" aria-label="All chats" className="flex h-11 w-11 items-center justify-center rounded-full text-tint">
              <ChevronLeft className="h-6 w-6" aria-hidden />
            </Link>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-fill">
              {d.conversation.shop.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.conversation.shop.logo} alt="" className="h-full w-full object-cover" />
              ) : (
                <Store className="h-5 w-5 text-label-2" aria-hidden />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[17px] font-semibold text-label">{d.conversation.shop.name}</span>
              <span className="block text-[13px] text-label-2">Replies show here and on your phone</span>
            </span>
            <Link
              href={d.conversation.shop.handle ? `/${d.conversation.shop.handle}` : `/stores/${d.conversation.shop.id}`}
              className="flex min-h-[40px] items-center rounded-full bg-fill px-3 text-[14px] font-semibold text-label"
            >
              Shop
            </Link>
          </header>
        )}
      />
    </Page>
  );
}
