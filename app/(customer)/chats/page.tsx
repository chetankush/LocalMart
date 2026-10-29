"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-provider";
import { LargeTitle, Page } from "@/components/app/ui";
import ChatList from "@/components/chat/ChatList";
import { signInHref } from "@/lib/auth/returnTo";

/** The buyer's chats with shops */
export default function ChatsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) router.push(signInHref("/chats"));
  }, [user, loading, router]);

  return (
    <Page>
      <LargeTitle title="Chats" subtitle="Your messages with shops · दुकानों से बातचीत" />
      {user && <ChatList side="BUYER" />}
    </Page>
  );
}
