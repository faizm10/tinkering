import Link from "next/link";
import { format, parseISO } from "date-fns";

import { ProposalReview } from "@/components/approvals/proposal-review";
import { PageHeader } from "@/components/sonae/page-header";
import { Section } from "@/components/sonae/section";
import { EmptyState } from "@/components/sonae/states";
import { Button } from "@/components/ui/button";
import { getAllProposals, getProposal } from "@/server/services/sonae";

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ proposal?: string }>;
}) {
  const { proposal: selectedProposalId } = await searchParams;
  const selected = selectedProposalId ? await getProposal(selectedProposalId) : null;
  const proposals = await getAllProposals();
  const pending = proposals.filter((item) => item.status === "pending");

  if (selected) {
    return (
      <div className="space-y-9">
        <PageHeader
          eyebrow="Proposed plan"
          title={selected.proposedPlanJson.lifeEvent.title}
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link href="/approvals">All plans</Link>
            </Button>
          }
        />
        <ProposalReview proposalId={selected.id} proposal={selected.proposedPlanJson} />
      </div>
    );
  }

  return (
    <div className="space-y-9">
      <PageHeader
        title="Approvals"
        description="Sonae drafts plans. Nothing is saved until you approve one."
      />

      <Section title="Waiting for review" count={pending.length}>
        {pending.length ? (
          <ul className="divide-y divide-hairline-soft">
            {pending.map((proposal) => (
              <li key={proposal.id}>
                <Link
                  href={`/approvals?proposal=${proposal.id}`}
                  className="group/plan flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:gap-6"
                >
                  <time
                    dateTime={proposal.createdAt}
                    className="type-mono shrink-0 text-muted sm:w-28"
                  >
                    {format(parseISO(proposal.createdAt), "MMM d, HH:mm")}
                  </time>
                  <div className="min-w-0 flex-1">
                    <p className="type-card-title">{proposal.proposedPlanJson.lifeEvent.title}</p>
                    <p className="type-meta mt-0.5">{proposal.proposedPlanJson.summary}</p>
                  </div>
                  <span className="type-meta shrink-0 transition-colors duration-[var(--dur-hover)] group-hover/plan:text-ink">
                    Review
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            message="No plans waiting for review."
            hint="Describe a situation and Sonae will draft one for you to check."
            action={{ label: "Open the composer", href: "/dashboard" }}
          />
        )}
      </Section>
    </div>
  );
}
