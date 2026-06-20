import { createHmac, timingSafeEqual } from "node:crypto";
import { SignJWT, importPKCS8 } from "jose";

type GitHubRepository = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  archived: boolean;
  default_branch: string;
  owner: { login: string };
};

export function githubConfigured() {
  return Boolean(
    process.env.GITHUB_APP_ID &&
      process.env.GITHUB_APP_PRIVATE_KEY &&
      process.env.GITHUB_WEBHOOK_SECRET,
  );
}

async function createAppJwt() {
  const appId = process.env.GITHUB_APP_ID;
  const encodedKey = process.env.GITHUB_APP_PRIVATE_KEY;
  if (!appId || !encodedKey) throw new Error("GitHub App credentials are not configured");

  const privateKey = await importPKCS8(encodedKey.replace(/\\n/g, "\n"), "RS256");
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "RS256" })
    .setIssuedAt(now - 60)
    .setExpirationTime(now + 9 * 60)
    .setIssuer(appId)
    .sign(privateKey);
}

export async function getInstallationToken(installationId: number) {
  const jwt = await createAppJwt();
  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${jwt}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`GitHub installation token failed: ${response.status}`);
  }

  return (await response.json()) as { token: string; expires_at: string };
}

export async function getInstallation(installationId: number) {
  const jwt = await createAppJwt();
  const response = await fetch(`https://api.github.com/app/installations/${installationId}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${jwt}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`GitHub installation lookup failed: ${response.status}`);
  return (await response.json()) as {
    id: number;
    account: { id: number; login: string; type: string };
    suspended_at: string | null;
  };
}

export async function listInstallationRepositories(installationId: number) {
  const { token } = await getInstallationToken(installationId);
  const repositories: GitHubRepository[] = [];
  let page = 1;

  while (page <= 10) {
    const response = await fetch(
      `https://api.github.com/installation/repositories?per_page=100&page=${page}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
        cache: "no-store",
      },
    );
    if (!response.ok) throw new Error(`GitHub repository sync failed: ${response.status}`);
    const body = (await response.json()) as {
      repositories: GitHubRepository[];
      total_count: number;
    };
    repositories.push(...body.repositories);
    if (repositories.length >= body.total_count || body.repositories.length < 100) break;
    page += 1;
  }

  return repositories;
}

export function verifyGitHubWebhook(payload: string, signature: string | null) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret || !signature?.startsWith("sha256=")) return false;
  const expected = `sha256=${createHmac("sha256", secret).update(payload).digest("hex")}`;
  if (signature.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
