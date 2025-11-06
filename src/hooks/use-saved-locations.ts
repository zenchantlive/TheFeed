"use client";

import { useState, useCallback } from "react";
import { useSession } from "@/lib/auth-client";

export function useSavedLocation(foodBankId: string) {
  const { data: session } = useSession();
  const [isSaved, setIsSaved] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkSaved = useCallback(async () => {
    if (!session?.user) {
      setIsSaved(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/locations?foodBankId=${encodeURIComponent(foodBankId)}`
      );
      if (response.ok) {
        const data = await response.json();
        setIsSaved(data.isSaved);
      } else {
        setIsSaved(false);
      }
    } catch (error) {
      console.error("Error checking saved status:", error);
      setIsSaved(false);
    }
  }, [foodBankId, session?.user]);

  const saveLocation = useCallback(async () => {
    if (!session?.user) {
      return { success: false, error: "Please sign in to save locations" };
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodBankId }),
      });

      if (response.ok) {
        setIsSaved(true);
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error || "Failed to save" };
      }
    } catch (error) {
      console.error("Error saving location:", error);
      return { success: false, error: "Failed to save location" };
    } finally {
      setIsLoading(false);
    }
  }, [foodBankId, session?.user]);

  const unsaveLocation = useCallback(async () => {
    if (!session?.user) {
      return { success: false, error: "Please sign in" };
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/locations?foodBankId=${encodeURIComponent(foodBankId)}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setIsSaved(false);
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error || "Failed to unsave" };
      }
    } catch (error) {
      console.error("Error unsaving location:", error);
      return { success: false, error: "Failed to unsave location" };
    } finally {
      setIsLoading(false);
    }
  }, [foodBankId, session?.user]);

  const toggleSave = useCallback(async () => {
    if (isSaved) {
      return await unsaveLocation();
    } else {
      return await saveLocation();
    }
  }, [isSaved, saveLocation, unsaveLocation]);

  return {
    isSaved,
    isLoading,
    saveLocation,
    unsaveLocation,
    toggleSave,
    checkSaved,
    isSignedIn: Boolean(session?.user),
  };
}
