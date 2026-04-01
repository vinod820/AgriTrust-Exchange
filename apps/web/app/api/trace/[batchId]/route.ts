import { NextResponse } from "next/server";
import { getTrace } from "@/lib/data/mock-db";

export async function GET(_: Request, { params }: { params: { batchId: string } }) {
  return NextResponse.json(getTrace(params.batchId));
}

