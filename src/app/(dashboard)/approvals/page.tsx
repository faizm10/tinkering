import Link from "next/link";
import { ProposalReview } from "@/components/approvals/proposal-review";
import { EmptyState, Section } from "@/components/life-admin/section";
import { getAllProposals } from "@/server/services/life-admin";
import { getDemoProposal } from "@/server/services/demo-store";

export default async function ApprovalsPage({ searchParams }: { searchParams: Promise<{ proposal?: string }> }) {
  const { proposal: selectedProposalId } = await searchParams;
  const selected = selectedProposalId ? getDemoProposal(selectedProposalId) : null;
  const proposals = await getAllProposals();

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <h1 className="text-3xl font-semibold">Agent Approvals</h1>
      {selected ? (
        <ProposalReview proposalId={selected.id} proposal={selected.proposedPlanJson} />
      ) : (
        <Section title="Pending suggestions">
          {proposals.filter((item) => item.status === "pending").length ? (
            <div className="divide-y divide-border">
              {proposals.filter((item) => item.status === "pending").map((proposal) => (
                <Link key={proposal.id} href={`/approvals?proposal=${proposal.id}`} className="block py-4">
                  <p className="font-medium">{proposal.proposedPlanJson.lifeEvent.title}</p>
                  <p className="text-sm text-muted-foreground">{proposal.proposedPlanJson.summary}</p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState>No pending agent suggestions.</EmptyState>
          )}
        </Section>
      )}
    </div>
  );
}
