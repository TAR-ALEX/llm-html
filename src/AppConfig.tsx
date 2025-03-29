export type AppConfig = {
  showSystemPrompt: boolean;
  expandThinkingByDefault: boolean;
  wideAssistantMessages: boolean;
  borderAssistantMessages: boolean;
  theme: number;
  replaceSystemPromptOnConfigChange: boolean;
  markdownForUserMessages: boolean;
  smoothAnimations: boolean;
}

export const defaultAppConfig: AppConfig = {
  showSystemPrompt: true,
  expandThinkingByDefault: true,
  wideAssistantMessages: false,
  borderAssistantMessages: true,
  theme: 0,
  replaceSystemPromptOnConfigChange: true,
  markdownForUserMessages: false,
  smoothAnimations: false,
};