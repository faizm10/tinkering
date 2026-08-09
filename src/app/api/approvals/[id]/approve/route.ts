import { approveProposal } from "@/server/approvals/approval-service";

export async function POST(request: Request, context: { params: Promise<unknown> }) {
  const { id } = (await context.params) as { id: string };
  try {
    const eventId = await approveProposal(id, await request.json());
    return Response.json({ eventId });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Approval failed." }, { status: 400 });
  }
}
