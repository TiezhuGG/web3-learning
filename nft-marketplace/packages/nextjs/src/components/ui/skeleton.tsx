// 新建骨架屏组件
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-neutral-900", className)}
      {...props}
    />
  );
}

// 骨架屏卡片布局
export function SkeletonCard() {
  return (
    <div className="border border-gray-600/50 rounded-lg overflow-hidden">
      <Skeleton className="h-[218px] w-full rounded-none" />
      <div className="p-4 space-y-1.5">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-3/5" />
          <Skeleton className="h-5 w-8" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-1/2" />
          <Skeleton className="h-9 w-1/2" />
        </div>
      </div>
    </div>
  );
}
