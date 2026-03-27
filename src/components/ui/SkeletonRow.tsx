export function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-gray-100">
      {/* rank */}
      <td className="px-4 py-3">
        <div className="h-4 w-6 rounded bg-gray-200" />
      </td>
      {/* name + logo */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gray-200" />
          <div className="space-y-1.5">
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="h-3 w-10 rounded bg-gray-200" />
          </div>
        </div>
      </td>
      {/* price */}
      <td className="px-4 py-3">
        <div className="h-4 w-20 rounded bg-gray-200" />
      </td>
      {/* 24h % */}
      <td className="px-4 py-3">
        <div className="h-4 w-14 rounded bg-gray-200" />
      </td>
      {/* market cap */}
      <td className="px-4 py-3">
        <div className="h-4 w-24 rounded bg-gray-200" />
      </td>
      {/* sparkline */}
      <td className="px-4 py-3">
        <div className="h-8 w-24 rounded bg-gray-200" />
      </td>
    </tr>
  );
}
