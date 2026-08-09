import { LoadingState, SkeletonLine } from "@/components/life-admin/states";

/** Wide mono duration on the left, the obligation on the right. */
export default function LoadingWaiting() {
  return (
    <LoadingState label="Loading what you are waiting on">
      <div className="space-y-9">
        <div className="space-y-2.5">
          <SkeletonLine className="h-7 w-44" />
          <SkeletonLine className="w-80" />
        </div>
        <div className="space-y-6 border-t border-hairline pt-5">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex flex-col gap-3 sm:flex-row sm:gap-6">
              <SkeletonLine className="h-6 w-20 shrink-0" />
              <div className="flex-1 space-y-2">
                <SkeletonLine className="w-1/3" />
                <SkeletonLine className="w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </LoadingState>
  );
}
