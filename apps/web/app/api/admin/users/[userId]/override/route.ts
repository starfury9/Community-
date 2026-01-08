import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { toggleAccessOverride } from "@/lib/access";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();

    // Check if user is admin
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    const body = await request.json();
    const { override } = body;

    if (typeof override !== "boolean") {
      return NextResponse.json(
        { error: "Override must be a boolean" },
        { status: 400 }
      );
    }

    await toggleAccessOverride(userId, session.user.id, override);

    return NextResponse.json({ success: true, override });
  } catch (error) {
    console.error("Error toggling access override:", error);
    return NextResponse.json(
      { error: "Failed to toggle access override" },
      { status: 500 }
    );
  }
}
