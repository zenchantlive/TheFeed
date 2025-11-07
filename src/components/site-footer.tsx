import { GitHubStars } from "./ui/github-stars";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 py-6 text-center text-sm text-muted-foreground">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center space-y-3">
          <GitHubStars repo="zenchantlive/TheFeed" />
          <p>
            TheFeed &copy; {new Date().getFullYear()} &middot; Cooking with the{" "}
            <a
              href="https://github.com/leonvanzyl/agentic-coding-starter-kit"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-accent hover:underline"
            >
              Agentic Coding Starter Kit
            </a>
          </p>
          <p className="text-xs text-muted-foreground opacity-80">
            Reminder: hunger jokes are welcome, hunger itself is not. Feed a neighbor today.
          </p>
        </div>
      </div>
    </footer>
  );
}
