"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Trophy, PartyPopper, ArrowRight, Twitter, Linkedin, Share2 } from "lucide-react";
import { fireCelebration, fireMegaCelebration } from "./celebration-confetti";

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "module" | "course";
  moduleTitle?: string;
  moduleOrder?: number;
  nextModuleId?: string;
  nextModuleTitle?: string;
}

export function CelebrationModal({
  isOpen,
  onClose,
  type,
  moduleTitle,
  moduleOrder,
  nextModuleId,
  nextModuleTitle,
}: CelebrationModalProps) {
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);

  // Trigger confetti when modal opens
  useEffect(() => {
    if (isOpen && !hasTriggeredConfetti) {
      setHasTriggeredConfetti(true);
      if (type === "course") {
        fireMegaCelebration();
      } else {
        fireCelebration();
      }
    }
  }, [isOpen, hasTriggeredConfetti, type]);

  // Reset confetti flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasTriggeredConfetti(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const shareText =
    type === "course"
      ? "I just completed the AI Systems Architect course! 🎉🚀"
      : `I just completed Module ${moduleOrder}: ${moduleTitle}! 🎉`;

  const shareUrl = typeof window !== "undefined" ? window.location.origin : "";

  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    shareText
  )}&url=${encodeURIComponent(shareUrl)}`;

  const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    shareUrl
  )}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title:
            type === "course"
              ? "Course Complete!"
              : `Module ${moduleOrder} Complete!`,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed
        console.log("Share cancelled:", err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-background p-8 shadow-xl animate-in zoom-in-95 duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500">
            {type === "course" ? (
              <Trophy className="h-10 w-10 text-white" />
            ) : (
              <PartyPopper className="h-10 w-10 text-white" />
            )}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold mb-2">
            {type === "course" ? (
              <>
                Congratulations! 🎉
                <br />
                <span className="text-primary">Course Complete!</span>
              </>
            ) : (
              <>
                Module {moduleOrder} Complete!
              </>
            )}
          </h2>

          {/* Subtitle */}
          <p className="text-muted-foreground mb-6">
            {type === "course"
              ? "You've completed the entire AI Systems Architect course. Amazing achievement!"
              : `You've finished "${moduleTitle}". Keep up the great work!`}
          </p>

          {/* Share section */}
          <div className="mb-6">
            <p className="text-sm font-medium text-muted-foreground mb-3">
              Share your progress
            </p>
            <div className="flex items-center justify-center gap-3">
              <a
                href={twitterShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1DA1F2] text-white hover:opacity-90 transition-opacity"
                aria-label="Share on Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href={linkedInShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0A66C2] text-white hover:opacity-90 transition-opacity"
                aria-label="Share on LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              {typeof navigator !== "undefined" && navigator.share && (
                <button
                  onClick={handleShare}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground hover:bg-muted/80 transition-colors"
                  aria-label="Share"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            {type !== "course" && nextModuleId ? (
              <Link
                href={`/course/${nextModuleId}`}
                onClick={onClose}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Continue to {nextModuleTitle || "Next Module"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/dashboard"
                onClick={onClose}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {type === "course" ? "Back to Dashboard" : "View Progress"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}

            <button
              onClick={onClose}
              className="w-full rounded-lg border border-input bg-background px-6 py-3 text-sm font-medium hover:bg-accent transition-colors"
            >
              {type === "course" ? "Stay Here" : "Keep Learning"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
