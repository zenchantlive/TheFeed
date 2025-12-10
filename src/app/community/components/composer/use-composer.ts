"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PostIntent, FeedPost } from "../../types";

/**
 * Composer hook
 *
 * Handles post composition state and submission logic.
 */
interface UseComposerProps {
  initialContent?: string;
  onSuccess?: () => void;
}

export function useComposer({ initialContent = "", onSuccess }: UseComposerProps = {}, defaultIntent: PostIntent = "need") {
  const router = useRouter();
  const [composerValue, setComposerValue] = useState(initialContent);
  const [postIntent, setPostIntent] = useState<PostIntent>(defaultIntent);
  const [isPosting, setIsPosting] = useState(false);

  const handlePost = async () => {
    const content = composerValue.trim();
    if (!content) return;

    const mood = postIntent === "need" ? "hungry" : "full";
    const kind: FeedPost["kind"] = postIntent === "need" ? "request" : "share";

    setIsPosting(true);
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          mood,
          kind,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create post");
      }

      setComposerValue("");
      onSuccess?.();
      router.refresh();
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  return {
    composerValue,
    setComposerValue,
    postIntent,
    setPostIntent,
    isPosting,
    handlePost,
  };
}
