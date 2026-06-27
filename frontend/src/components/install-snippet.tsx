"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InstallSnippet({ snippet }: { snippet: string }) {
  const [copied, setCopied] = useState(false);

  async function copySnippet() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={copySnippet}>
      <Copy className="size-4" />
      {copied ? "Copied" : "Copy snippet"}
    </Button>
  );
}
