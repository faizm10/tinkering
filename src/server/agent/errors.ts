export type AgentErrorCategory =
  | "configuration"
  | "timeout"
  | "step_limit"
  | "tool"
  | "validation"
  | "refusal"
  | "provider"
  | "state"
  | "clarification";

export class AgentError extends Error {
  constructor(
    message: string,
    readonly category: AgentErrorCategory,
    readonly userMessage: string,
  ) {
    super(message);
  }
}

export class AgentConfigurationError extends AgentError {
  constructor(message = "AI provider configuration is incomplete.") {
    super(message, "configuration", "The AI provider has not been configured. Demo mode is still available.");
  }
}

export class AgentTimeoutError extends AgentError {
  constructor(message = "Agent timed out.") {
    super(message, "timeout", "Creating the plan took too long. Please try again.");
  }
}

export class AgentStepLimitError extends AgentError {
  constructor(message = "Agent reached the step limit.") {
    super(message, "step_limit", "Sonae reached its planning limit before finishing. Please try a simpler description.");
  }
}

export class AgentToolError extends AgentError {
  constructor(message = "Agent tool failed.") {
    super(message, "tool", "Sonae could not check the information it needed.");
  }
}

export class AgentValidationError extends AgentError {
  constructor(message = "Agent output failed validation.") {
    super(message, "validation", "Sonae couldn’t create a valid plan. Your original message is still available.");
  }
}

export class AgentRefusalError extends AgentError {
  constructor(message = "Agent refused the request.") {
    super(message, "refusal", "Sonae cannot help with that request.");
  }
}

export class AgentProviderError extends AgentError {
  constructor(message = "Agent provider failed.") {
    super(message, "provider", "Sonae could not reach the AI provider. Demo mode is still available.");
  }
}

export class AgentStateError extends AgentError {
  constructor(message = "Invalid agent state transition.") {
    super(message, "state", "Sonae could not continue that plan state.");
  }
}

export class AgentClarificationError extends AgentError {
  constructor(message = "Clarification could not be applied.") {
    super(message, "clarification", "Sonae could not use that clarification. Please try again.");
  }
}

export function toSafeAgentMessage(error: unknown) {
  if (error instanceof AgentError) return error.userMessage;
  return "Sonae could not draft a plan. Try describing the situation again.";
}

export function toAgentErrorCategory(error: unknown): AgentErrorCategory | null {
  return error instanceof AgentError ? error.category : null;
}
