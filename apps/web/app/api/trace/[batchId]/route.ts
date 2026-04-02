import { NextResponse } from "next/server";
import { getMergedTrace } from "@/lib/contracts/read-models";

export async function GET(_: Request, { params }: { params: { batchId: string } }) {
  return NextResponse.json(await getMergedTrace(params.batchId));
}

