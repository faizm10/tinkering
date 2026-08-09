import { LoadingState, SkeletonBlock, SkeletonLine } from "@/components/life-admin/states";

/** Three grouped bands of checkbox rows, matching the tasks screen. */
export default function LoadingTasks() {
  return (
    <LoadingState label="Loading your tasks">
      <div className="space-y-9">
        <div className="space-y-2.5">
          <SkeletonLine className="h-7 w-40" />
          <SkeletonLine className="w-72" />
        </div>
        {[0, 1, 2].map((group) => (
          <div key={group} className="space-y-4">
            <SkeletonLine className="h-5 w-24" />
            <div className="space-y-4 border-t border-hairline pt-4">
              {[0, 1].map((row) => (
                <div key={row} className="flex gap-3">
                  <SkeletonBlock className="size-[18px] shrink-0 rounded-[5px]" />
                  <div className="flex-1 space-y-2">
                    <SkeletonLine className="w-2/5" />
                    <SkeletonLine className="w-1/4" />
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
