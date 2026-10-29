import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/vendor-requests/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to update vendor request" }));
      return NextResponse.json({ error: error.message, success: false }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ ...data, success: true });
  } catch (error) {
    console.error("Vendor request update error:", error);
    return NextResponse.json({ error: "Error updating vendor request", success: false }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const response = await fetch(`${API_BASE_URL}/vendor-requests/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to delete vendor request" }));
      return NextResponse.json({ error: error.message, success: false }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ ...data, success: true });
  } catch (error) {
    console.error("Vendor request delete error:", error);
    return NextResponse.json({ error: "Error deleting vendor request", success: false }, { status: 500 });
  }
}
