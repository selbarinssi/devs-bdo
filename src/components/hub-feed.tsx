import { ImagePlus, Loader2, Sparkles, Trash2, Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  createFeedPost,
  deleteFeedPost,
  listFeedPosts,
  toggleReaction,
  validateFeedFile,
  type FeedPost,
} from "@/lib/feed-api";
import {
  listProfiles,
  setProfileRole,
  useHubProfile,
  type HubRole,
  type ProfileRow,
} from "@/lib/profile";
import { listHubEmojis, hubReactionToken, type HubEmoji, uploadHubEmoji } from "@/lib/hub-emojis";
import { fetchPreviewsForText, type LinkPreview } from "@/lib/link-preview";
import { cn } from "@/lib/utils";

// TEMP: file was accidentally overwritten; full restore in progress via previous commit content
export function HubFeed() {
  return (
    <div className="hub-narrow flex flex-col gap-5 py-16 text-center">
      <p className="hub-body text-muted-foreground">Feed is restoring — refresh in a moment.</p>
    </div>
  );
}
