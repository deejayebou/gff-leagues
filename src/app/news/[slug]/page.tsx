import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPrisma().newsPost.findUnique({
    where: { slug },
    include: { league: true },
  });

  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-6">
      <Link href="/news" className="text-sm font-bold text-emerald-700">Back to news</Link>
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[#d91f2d]">
        {post.league?.name ?? "GFF Leagues"}
      </p>
      <h1 className="mt-2 text-4xl font-black leading-tight text-zinc-950">{post.title}</h1>
      <p className="mt-3 text-sm font-semibold text-zinc-500">{post.publishedAt.toLocaleDateString("en-GM")}</p>
      {post.coverImageUrl ? (
        <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-md bg-zinc-100">
          <Image src={post.coverImageUrl} alt="" fill unoptimized className="object-cover" />
        </div>
      ) : null}
      <p className="mt-5 text-lg leading-8 text-zinc-700">{post.excerpt}</p>
      <div
        className="mt-6 rounded-md border border-zinc-200 bg-white p-5 text-base leading-8 text-zinc-800 shadow-sm [&_ol]:ml-5 [&_ol]:list-decimal [&_strong]:font-black [&_ul]:ml-5 [&_ul]:list-disc"
        dangerouslySetInnerHTML={{ __html: post.body }}
      />
    </article>
  );
}
