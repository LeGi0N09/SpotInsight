export function CardSkeleton() {
  return (
    <div className="bg-[#111111] rounded-2xl p-4 animate-pulse">
      <div className="h-4 bg-[#1a1a1a] rounded w-1/3 mb-3"></div>
      <div className="h-8 bg-[#1a1a1a] rounded w-2/3 mb-2"></div>
      <div className="h-3 bg-[#1a1a1a] rounded w-1/2"></div>
    </div>
  );
}

export function TrackSkeleton() {
  return (
    <div className="bg-[#111111] rounded-2xl p-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded bg-[#1a1a1a]"></div>
        <div className="w-16 h-16 rounded bg-[#1a1a1a]"></div>
        <div className="flex-1">
          <div className="h-4 bg-[#1a1a1a] rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-[#1a1a1a] rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );
}

export function KPISkeleton() {
  return (
    <div className="bg-[#0e0e0e] rounded-md p-3 border border-white/5 animate-pulse">
      <div className="h-3 bg-[#1a1a1a] rounded w-1/2 mb-2"></div>
      <div className="h-6 bg-[#1a1a1a] rounded w-3/4"></div>
    </div>
  );
}
