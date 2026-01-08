"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface AccessOverrideToggleProps {
  userId: string;
  initialValue: boolean;
}

export function AccessOverrideToggle({
  userId,
  initialValue,
}: AccessOverrideToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEnabled, setIsEnabled] = useState(initialValue);

  const handleToggle = async () => {
    const previousValue = isEnabled;
    setIsEnabled(!isEnabled); // Optimistic update

    try {
      const response = await fetch(`/api/admin/users/${userId}/override`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to update");
      }

      const data = await response.json();
      setIsEnabled(data.accessOverride);

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Failed to toggle access override:", error);
      setIsEnabled(previousValue); // Rollback
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-medium">Access Override</h3>
        <p className="text-sm text-muted-foreground">
          Grant full access without subscription
        </p>
      </div>
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          isEnabled ? "bg-primary" : "bg-muted"
        } ${isPending ? "opacity-50" : ""}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isEnabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
