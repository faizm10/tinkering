import { LoadingState, SkeletonBlock, SkeletonLine } from "@/components/life-admin/states";

/** A grid of event cards, so the layout does not jump when they arrive. */
export default function LoadingEvents() {
  return (
    <LoadingState label="Loading your life events">
      <div className="space-y-9">
        <div className="space-y-2.5">
          <SkeletonLine className="h-7 w-44" />
          <SkeletonLine className="w-80" />
        </div>
        <div className="space-y-4">
          <SkeletonLine className="h-5 w-20" />
          <div className="grid gap-4 border-t border-hairline pt-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((card) => (
              <SkeletonBlock key={card} className="h-52 border border-hairline bg-surface" />
            ))}
          </div>
        </div>
      </div>
    </LoadingState>
  );
}
