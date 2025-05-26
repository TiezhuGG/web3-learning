import { cn } from "@/lib/utils";

export const LoadingSpinner = ({ className }: { className?: string }) => (
  <div
    className={cn(
      className,
      `animate-spin rounded-full h-5 w-5 border-b-2 border-white inline-block ml-2`
    )}
  ></div>
);
