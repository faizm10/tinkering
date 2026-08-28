import { AssistantChat } from "@/components/agent/assistant-chat";
import { toChatMessage } from "@/server/agent/chat";
import { getDataRepository } from "@/server/providers";
import { requireUser } from "@/lib/auth/session";

export default async function AssistantPage() {
  const user = await requireUser();
  const repository = getDataRepository();
  const [dashboard, conversations] = await Promise.all([
    repository.getDashboardData(user.id),
    repository.listAgentConversations(user.id),
  ]);
  const conversation = conversations[0] ?? await repository.createAgentConversation(user.id);
  const messages = await repository.listAgentMessages(user.id, conversation.id);

  return (
    <AssistantChat
      conversationId={conversation.id}
      initialMessages={messages.map(toChatMessage)}
      context={{
        today: dashboard.today,
        upcoming: dashboard.upcoming,
        waiting: dashboard.waiting,
        proposals: dashboard.proposals,
      }}
    />
  );
}
