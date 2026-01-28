import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Forward query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const query = status ? `?status=${status}` : "";

    const response = await fetch(`${API_BASE_URL}/vendors${query}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to fetch vendors" }));
      return NextResponse.json({ error: error.message }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Vendors fetch error:", error);
    return NextResponse.json({ error: "Error fetching vendors" }, { status: 500 });
  }
}
