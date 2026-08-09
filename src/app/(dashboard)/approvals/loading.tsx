import { AgentTimeline } from "@/components/agent/agent-timeline";
import { LoadingState, SkeletonLine } from "@/components/life-admin/states";

/**
 * The one loading state that shows the agent stage palette: the user is
 * waiting on the agent here, so the timeline is the honest progress signal.
 */
export default function LoadingApprovals() {
  return (
    <LoadingState label="Loading the proposed plan">
      <div className="space-y-9">
        <div className="space-y-2.5">
          <SkeletonLine className="w-24" />
          <SkeletonLine className="h-7 w-64" />
        </div>

        <div className="border-y border-hairline py-4">
          <AgentTimeline stages={["understanding"]} activeStage="understanding" />
        </div>

        <div className="space-y-4">
          <SkeletonLine className="h-5 w-20" />
          <div className="space-y-3 border-t border-hairline pt-4">
            <SkeletonLine className="h-10 w-full" />
            <SkeletonLine className="h-10 w-full" />
          </div>
        </div>
      </div>
    </LoadingState>
  );
}
