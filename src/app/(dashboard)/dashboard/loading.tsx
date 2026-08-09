import { LoadingState, SkeletonBlock, SkeletonLine } from "@/components/life-admin/states";

/** Shaped like the dashboard: brief, composer, then two task sections. */
export default function LoadingDashboard() {
  return (
    <LoadingState label="Loading your dashboard">
      <div className="space-y-10">
        <div className="space-y-3">
          <SkeletonLine className="w-32" />
          <SkeletonLine className="h-7 w-64" />
          <SkeletonLine className="w-full max-w-xl" />
        </div>

        <SkeletonBlock className="h-52 border border-hairline bg-surface" />

        {[0, 1].map((section) => (
          <div key={section} className="space-y-4">
            <SkeletonLine className="h-5 w-28" />
            <div className="space-y-4 border-t border-hairline pt-4">
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex gap-3">
                  <SkeletonBlock className="size-[18px] shrink-0 rounded-[5px]" />
                  <div className="flex-1 space-y-2">
                    <SkeletonLine className="w-1/3" />
                    <SkeletonLine className="w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </LoadingState>
  );
}
