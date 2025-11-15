"use client";

/**
 * Hook to inject a prompt into the CopilotChat input field
 */
export function usePromptInjection() {
  const injectPrompt = (prompt: string) => {
    // Find the CopilotKit textarea
    const input = document.querySelector(
      ".copilotKitInput textarea"
    ) as HTMLTextAreaElement;

    if (input) {
      input.value = prompt;
      input.focus();

      // Trigger input event for React
      const event = new Event("input", { bubbles: true });
      input.dispatchEvent(event);
    }
  };

  return { injectPrompt };
}
