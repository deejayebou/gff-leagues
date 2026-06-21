"use client";

import { Bold, Italic, List, ListOrdered, Pilcrow, Underline } from "lucide-react";
import { useRef, useState } from "react";

type RichTextEditorProps = {
  name: string;
  defaultValue?: string | null;
};

const tools = [
  { command: "bold", label: "Bold", icon: Bold },
  { command: "italic", label: "Italic", icon: Italic },
  { command: "underline", label: "Underline", icon: Underline },
  { command: "formatBlock", value: "p", label: "Paragraph", icon: Pilcrow },
  { command: "insertUnorderedList", label: "Bullets", icon: List },
  { command: "insertOrderedList", label: "Numbers", icon: ListOrdered },
];

export function RichTextEditor({ name, defaultValue }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(defaultValue ?? "");

  function run(command: string, value?: string) {
    document.execCommand(command, false, value);
    const next = editorRef.current?.innerHTML ?? "";
    setHtml(next);
  }

  return (
    <div className="overflow-hidden rounded-md border border-zinc-200 bg-white">
      <input type="hidden" name={name} value={html} />
      <div className="flex flex-wrap gap-1 border-b border-zinc-200 bg-zinc-50 p-2">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={`${tool.command}-${tool.value ?? ""}`}
              type="button"
              title={tool.label}
              onClick={() => run(tool.command, tool.value)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-700 hover:bg-white hover:text-zinc-950"
            >
              <Icon size={17} />
            </button>
          );
        })}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => setHtml(editorRef.current?.innerHTML ?? "")}
        className="min-h-80 bg-white p-4 text-base leading-7 text-zinc-900 outline-none [&_ol]:ml-5 [&_ol]:list-decimal [&_strong]:font-black [&_ul]:ml-5 [&_ul]:list-disc"
        dangerouslySetInnerHTML={{ __html: defaultValue ?? "" }}
      />
    </div>
  );
}
