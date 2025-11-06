import { GitHubStars } from "./ui/github-stars";

export function SiteFooter() {
  return (
    <footer className="border-t py-6 text-center text-sm text-muted-foreground">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center space-y-3">
          <GitHubStars repo="zenchantlive/TheFeed" />
          <p>
            FoodShare &copy; {new Date().getFullYear()} &middot; Built with the{" "}
            <a
              href="https://github.com/leonvanzyl/agentic-coding-starter-kit"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Agentic Coding Starter Kit
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
