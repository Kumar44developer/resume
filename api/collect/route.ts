import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import type { FetchResult, RawPost } from "@/lib/fetchers/types";
import { fetchRedditPosts } from "@/lib/fetchers/reddit";
