import { ToolCard } from "@/components/tools/ToolCard";
import type { Tool } from "@/lib/tools";

export function ToolGrid({ tools, compact = false }: { tools: Tool[]; compact?: boolean }) {
  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {tools.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} compact />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tools.map((tool) => (
        <ToolCard key={tool.slug} tool={tool} />
      ))}
    </div>
  );
}
