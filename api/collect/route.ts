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
    fetch: (): Promise<FetchResult> =>
      fetchHackerNewsPosts().then((r) => ({
        posts: r.posts as RawPost[],
        errors: r.errors,
        warnings: r.warnings,
      })),
  },
  {
    id: "github" as const,
    enabled: true,
    fetch: (): Promis
      fetchGithubIssues().then((r) => ({
        posts: r.posts as RawPost[],
        errors: r.errors,
        warnings: r.warnings,
      })),
  },
  {
    id: "producthunt" as const,
    enabled: true,
    fetch: (): Promise<FetchResult> =>
      fetchProductHuntComments().then((r) => ({
        posts: r.posts as RawPost[],
        errors: r.errors,
        warnings: r.warnings,
      })),
  },
  {
    id: "stackoverflow" as const,
    enabled: true,
    fetch: (): Promise<FetchResult> =>
      fetchStackOverflowQuestions().then((r) => ({
        posts: r.posts as RawPost[],
        errors: r.errors,
       warnings: r.warnings,
      })),
  },
] as const;

const UPSERT_BATCH_SIZE = 100;

async function upsertBatched(
  supabase: ReturnType<typeof createAdminClient>,
  posts: RawPost[]
): Promise<{ inserted: number; upsertError: string | null }> {
  let inserted = 0;

  for (let i = 0; i < posts.length; i += UPSERT_BATCH_SIZE) {
    const batch = posts.slice(i, i + UPSERT_BATCH_SIZE);
    const { error, count } = await supabase
      .from("raw_posts")
      .upsert(batch, {
        onConflict: "source,external_id",
        count: "exact",
      });
