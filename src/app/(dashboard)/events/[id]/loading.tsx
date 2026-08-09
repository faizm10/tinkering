import { LoadingState, SkeletonBlock, SkeletonLine } from "@/components/life-admin/states";

/** Header, overview card, then the event's stacked sections. */
export default function LoadingEvent() {
  return (
    <LoadingState label="Loading this life event">
      <div className="space-y-10">
        <div className="space-y-2.5">
          <SkeletonLine className="w-20" />
          <SkeletonLine className="h-7 w-72" />
          <SkeletonLine className="w-full max-w-lg" />
        </div>
        <SkeletonBlock className="h-40 border border-hairline bg-surface" />
        {[0, 1].map((section) => (
          <div key={section} className="space-y-4">
            <SkeletonLine className="h-5 w-24" />
            <div className="space-y-3 border-t border-hairline pt-4">
              <SkeletonLine className="w-3/5" />
              <SkeletonLine className="w-2/5" />
            </div>
          </div>
        ))}
      </div>
    </LoadingState>
  );
}
