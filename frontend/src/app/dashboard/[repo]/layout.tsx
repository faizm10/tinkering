import { notFound } from "next/navigation";
import { RepositoryNav } from "@/components/repository-nav";
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
    <div>
      <RepositoryNav repository={repository} />
      {children}
    </div>
  );
}
