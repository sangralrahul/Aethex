export function SectionLoader({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 rounded-lg" style={{ background: "#E5E1D8", width: i === lines - 1 ? "65%" : "100%" }} />
      ))}
    </div>
  );
}

export function CardLoader({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border animate-pulse" style={{ background: "#FFFFFF", borderColor: "#E5E1D8", height: 120 }} />
      ))}
    </div>
  );
}
