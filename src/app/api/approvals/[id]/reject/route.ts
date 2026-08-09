import { rejectProposal } from "@/server/approvals/approval-service";

export async function POST(_request: Request, context: { params: Promise<unknown> }) {
  const { id } = (await context.params) as { id: string };
  try {
    await rejectProposal(id);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Rejection failed." }, { status: 400 });
  }
}
