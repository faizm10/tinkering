import { notFound } from "next/navigation";
import { RepositoryNav } from "@/components/repository-nav";
import { SetupBanner } from "@/components/setup-banner";
import { getRepository } from "@/lib/data";

export default async function RepositoryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ repo: string }>;
}) {
  const { repo } = await params;
  const repository = await getRepository(repo);
  if (!repository) notFound();

  return (
    <div className="space-y-6">
      <RepositoryNav repository={repository} />
      {repository.status !== "live" ? (
        <SetupBanner repoSlug={repo} repositoryName={repository.fullName} />
      ) : null}
      {children}
    </div>
  );
}
