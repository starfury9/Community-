"use client";

import Link from "next/link";
import { LockIcon } from "lucide-react";

interface ModuleLockOverlayProps {
  lockedBy: {
    moduleId: string;
    moduleTitle: string;
    moduleOrder: number;
  };
  className?: string;
}

/**
 * Overlay shown when trying to access a locked module
 */
export function ModuleLockOverlay({ lockedBy, className = "" }: ModuleLockOverlayProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="rounded-full bg-muted p-4 mb-4">
        <LockIcon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Module Locked</h2>
      <p className="text-muted-foreground max-w-md mb-6">
        Complete <strong>Module {lockedBy.moduleOrder}: {lockedBy.moduleTitle}</strong> to unlock this content.
      </p>
      <Link
        href={`/course/${lockedBy.moduleId}`}
        className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Go to Module {lockedBy.moduleOrder}
      </Link>
    </div>
  );
}

/**
 * Inline lock badge for module cards
 */
export function ModuleLockBadge({ moduleOrder }: { moduleOrder: number }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      <LockIcon className="h-3 w-3" />
      Complete Module {moduleOrder - 1} to unlock
    </div>
  );
}

/**
 * Full-page locked module display
 */
export function LockedModulePage({ 
  moduleTitle,
  moduleOrder,
  lockedBy,
}: { 
  moduleTitle: string;
  moduleOrder: number;
  lockedBy: {
    moduleId: string;
    moduleTitle: string;
    moduleOrder: number;
  };
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
          <LockIcon className="h-10 w-10 text-muted-foreground" />
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Module {moduleOrder} is Locked</h1>
        <p className="text-lg text-muted-foreground mb-2">{moduleTitle}</p>
        
        <p className="text-muted-foreground mb-8">
          To maintain the best learning experience, please complete the previous module first.
        </p>
        
        <div className="space-y-4">
          <Link
            href={`/course/${lockedBy.moduleId}`}
            className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 w-full"
          >
            Continue Module {lockedBy.moduleOrder}: {lockedBy.moduleTitle}
          </Link>
          
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-8 py-3 text-sm font-medium hover:bg-accent w-full"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
