import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ isAdmin: false, message: "Not authenticated" });
    }

    // Call NestJS backend to check admin status
    const response = await fetch(`${API_BASE_URL}/admin/check-auth`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json({ isAdmin: false, message: "Failed to verify admin status" });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Admin auth check error:", error);
    return NextResponse.json({ isAdmin: false, message: "Error checking admin status" });
  }
}
