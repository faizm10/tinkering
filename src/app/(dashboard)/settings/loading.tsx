import { LoadingState, SkeletonLine } from "@/components/sonae/states";

export default function LoadingSettings() {
  return (
    <LoadingState label="Loading your settings">
      <div className="max-w-2xl space-y-9">
        <div className="space-y-2.5">
          <SkeletonLine className="h-7 w-32" />
          <SkeletonLine className="w-80" />
        </div>
        <div className="space-y-5 border-t border-hairline pt-5">
          <SkeletonLine className="h-10 w-full" />
          <SkeletonLine className="h-10 w-full" />
          <SkeletonLine className="h-10 w-40" />
        </div>
      </div>
    </LoadingState>
  );
}
