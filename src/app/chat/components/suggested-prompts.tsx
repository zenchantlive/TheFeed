export type SuggestedPrompt = {
  label: string;
  value: string;
  icon: string;
};

type SuggestedPromptsProps = {
  prompts: SuggestedPrompt[];
  onSelect: (value: string) => void;
};

/**
 * Renders suggested prompts under the chat transcript so the user can
 * click once, edit the populated input, and send when ready.
 */
export function SuggestedPrompts({ prompts, onSelect }: SuggestedPromptsProps) {
  if (prompts.length === 0) return null;

  return (
    <section className="rounded-3xl border border-border bg-muted/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Suggested prompts
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {prompts.map((prompt) => (
          <button
            key={prompt.label}
            type="button"
            className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3 text-left text-sm transition hover:border-primary hover:bg-primary/5"
            onClick={() => onSelect(prompt.value)}
          >
            <div className="flex flex-col">
              <span className="font-medium text-foreground">
                {prompt.icon} {prompt.label}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">Tap to fill</span>
          </button>
        ))}
      </div>
    </section>
  );
}
