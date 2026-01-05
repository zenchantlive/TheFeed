import { Loader2 } from "lucide-react";

export default function CommunityLoading() {
    return (
        <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading community...</p>
            </div>
        </div>
    );
}
