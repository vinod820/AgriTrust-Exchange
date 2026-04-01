import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureVideoRoom } from "@/lib/data/mock-db";

const roomSchema = z.object({
  listingId: z.string().min(2),
  buyerName: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = roomSchema.parse(body);
    const room = ensureVideoRoom(parsed.listingId, parsed.buyerName);
    if (!room) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create video room"
      },
      { status: 400 }
    );
  }
}

