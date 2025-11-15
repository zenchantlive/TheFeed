import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import ChatV2Client from "./page-client";

export const metadata = {
  title: "AI Sous-Chef (v2) | TheFeed",
  description: "Your neighborhood AI assistant powered by CopilotKit",
};

export default async function ChatV2Page() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <ChatV2Client
      user={
        session?.user 
          ? {
              id: session.user.id,
              name: session.user.name || "",
              email: session.user.email || "",
              image: session.user.image || null,
            }
          : null
      }
    />
  );
}
