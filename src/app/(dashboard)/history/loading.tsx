import { LoadingState, SkeletonLine } from "@/components/life-admin/states";

/** A log: fixed-width timestamp column, then the sentence. */
export default function LoadingHistory() {
  return (
    <LoadingState label="Loading your history">
      <div className="space-y-9">
        <div className="space-y-2.5">
          <SkeletonLine className="h-7 w-32" />
          <SkeletonLine className="w-72" />
        </div>
        <div className="space-y-5 border-t border-hairline pt-5">
          {[0, 1, 2, 3, 4].map((row) => (
            <div key={row} className="flex flex-col gap-2 sm:flex-row sm:gap-5">
              <SkeletonLine className="w-28 shrink-0" />
              <SkeletonLine className="w-2/5" />
            </div>
          ))}
        </div>
      </div>
    </LoadingState>
  );
}
