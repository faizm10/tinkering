import { redirect } from "next/navigation";

export default async function RepositoryPage({
  params,
}: {
  params: Promise<{ repo: string }>;
}) {
  const { repo } = await params;
  redirect(`/dashboard/${repo}/overview`);
}
