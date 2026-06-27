import { cn } from "@/lib/utils";

export function ScrollableTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("-mx-1 overflow-x-auto px-1", className)}>
      <div className="min-w-[640px]">{children}</div>
    </div>
  );
}
