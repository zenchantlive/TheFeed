"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Copy, Terminal } from "lucide-react";

export function DeveloperInfo({ userId }: { userId: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!navigator.clipboard) {
      // Clipboard API not available, you could show an error toast or log this.
      console.error("Clipboard API not available in this context.");
      return;
    }
    try {
      await navigator.clipboard.writeText(userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <Card className="mt-6 border-dashed border-yellow-500/50 bg-yellow-500/5">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-yellow-600 mb-2">
          <Terminal className="w-4 h-4" />
          <span>Developer Tools</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Use this ID to configure your admin access in .env
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-muted p-2 rounded text-xs font-mono truncate">
            {userId}
          </code>
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="w-3 h-3 text-green-500" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 font-mono">
          ADMIN_USER_ID={userId}
        </p>
      </CardContent>
    </Card>
  );
}
