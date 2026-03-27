interface EmptyStateProps {
  query: string;
}

export function EmptyState({ query }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <span className="text-4xl" aria-hidden="true">
        🔍
      </span>
      <p className="text-base font-medium text-gray-800">
        No results for &ldquo;{query}&rdquo;
      </p>
      <p className="text-sm text-gray-500">Try a different name or symbol</p>
    </div>
  );
}
