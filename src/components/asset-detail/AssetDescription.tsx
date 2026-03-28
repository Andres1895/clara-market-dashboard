import { useState } from "react";

const PREVIEW_LENGTH = 300;

interface AssetDescriptionProps {
  text: string | null;
}

export function AssetDescription({ text }: AssetDescriptionProps) {
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;
  const plain = text.replace(/<[^>]+>/g, "");
  if (!plain.trim()) return null;

  const needsToggle = plain.length > PREVIEW_LENGTH;
  const displayed = needsToggle && !expanded ? `${plain.slice(0, PREVIEW_LENGTH)}…` : plain;

  return (
    <div className="text-sm text-gray-700">
      <p className="leading-relaxed">{displayed}</p>
      {needsToggle && (
        <button
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="mt-1 text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:rounded"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
