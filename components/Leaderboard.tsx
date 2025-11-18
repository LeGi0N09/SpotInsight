type LeaderboardItem = {
  name: string;
  plays: number;
};

type LeaderboardProps = {
  items: LeaderboardItem[];
};

export default function Leaderboard({ items }: LeaderboardProps) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={index}
          className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
            index === 0 ? 'bg-yellow-500 text-black' :
            index === 1 ? 'bg-gray-400 text-black' :
            index === 2 ? 'bg-orange-600 text-white' :
            'bg-white/10 text-zinc-400'
          }`}>
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-white truncate">{item.name}</div>
          </div>
          <div className="text-emerald-400 font-semibold">#{item.plays}</div>
        </div>
      ))}
    </div>
  );
}
