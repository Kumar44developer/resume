import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import type { FetchResult, RawPost } from "@/lib/fetchers/types";
import { fetchRedditPosts } from "@/lib/fetchers/reddit";
import { fetchHackerNewsPosts } from "@/lib/fetchers/hackernews";
import { fetchGithubIssues } from "@/lib/fetchers/github";
import { fetchProductHuntComments } from "@/lib/fetchers/producthunt";
import { fetchStackOverflowQuestions } from "@/lib/fetchers/stackoverflow";

const SOURCES = [
  {
    id: "reddit" as const,
    enabled: true,
    fetch: (): Promise<FetchResult> =>
      fetchRedditPosts().then((r) => ({
        posts: r.posts as RawPost[],
        errors: r.errors,
        warnings: r.warnings,
      })),
  },
  {
    id: "hn" as const,
    enabled: true,
