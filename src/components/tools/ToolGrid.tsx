import { ToolCard } from "@/components/tools/ToolCard";
import type { Tool } from "@/lib/tools";

export function ToolGrid({ tools }: { tools: Tool[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tools.map((tool) => (
        <ToolCard key={tool.slug} tool={tool} />
      ))}
    </div>
  );
}
