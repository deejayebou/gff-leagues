"use client";

import Image from "next/image";
import { ImagePlus, Link2 } from "lucide-react";
import { useState } from "react";

type ImageUploadFieldProps = {
  name: string;
  label: string;
  defaultValue?: string | null;
  help?: string;
  aspect?: "square" | "wide" | "portrait";
};

const aspectClass = {
  square: "aspect-square",
  wide: "aspect-[16/9]",
  portrait: "aspect-[4/5]",
};

export function ImageUploadField({
  name,
  label,
  defaultValue,
  help,
  aspect = "wide",
}: ImageUploadFieldProps) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [error, setError] = useState("");

  return (
    <div className="grid gap-3 rounded-md border border-zinc-200 bg-white p-3">
      <input type="hidden" name={name} value={value} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-zinc-950">{label}</p>
          {help ? <p className="mt-1 text-xs leading-5 text-zinc-500">{help}</p> : null}
        </div>
        <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-zinc-950 px-3 text-xs font-bold text-white">
          <ImagePlus size={16} />
          Upload
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;

              if (file.size > 1_500_000) {
                setError("Use an image under 1.5 MB for now.");
                return;
              }

              const reader = new FileReader();
              reader.onload = () => {
                setValue(String(reader.result ?? ""));
                setError("");
              };
              reader.readAsDataURL(file);
            }}
          />
        </label>
      </div>

      <div className={`relative overflow-hidden rounded-md bg-zinc-100 ${aspectClass[aspect]}`}>
        {value ? (
          <Image src={value} alt="" fill unoptimized className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-zinc-500">
            No image selected
          </div>
        )}
      </div>

      <label className="flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3">
        <Link2 size={16} className="text-zinc-400" />
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none"
          placeholder="/gff-logo.jpg or https://..."
        />
      </label>
      {error ? <p className="text-xs font-semibold text-red-700">{error}</p> : null}
    </div>
  );
}
