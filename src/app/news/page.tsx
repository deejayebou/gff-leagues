import Link from "next/link";
import { Newspaper } from "lucide-react";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getNews() {
  try {
    return await getPrisma().newsPost.findMany({
      include: { league: true },
      orderBy: { publishedAt: "desc" },
      take: 24,
    });
  } catch {
    return [];
  }
}

export default async function NewsPage() {
  const posts = await getNews();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Federation updates</p>
      <h1 className="mt-1 text-3xl font-black text-zinc-950">League News</h1>
      <p className="mt-2 max-w-2xl text-zinc-600">Official updates, competition notices, and league stories from GFF Leagues.</p>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {posts.map((post) => (
          <Link key={post.id} href={`/news/${post.slug}`} className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
            <Newspaper className="text-emerald-700" size={22} />
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-[#d91f2d]">
              {post.league?.name ?? "GFF Leagues"}
            </p>
            <h2 className="mt-1 text-xl font-bold text-zinc-950">{post.title}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{post.excerpt}</p>
            <p className="mt-3 text-xs font-semibold text-zinc-500">{post.publishedAt.toLocaleDateString("en-GM")}</p>
          </Link>
        ))}
      </div>

      {posts.length === 0 ? (
        <div className="mt-6 rounded-md border border-zinc-200 bg-white p-5 text-sm font-semibold text-zinc-600">
          No league news has been published yet.
        </div>
      ) : null}
    </div>
  );
}
