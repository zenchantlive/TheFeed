import { redirect } from "next/navigation";

export default function NewEventPage() {
  redirect("/community?action=create-event");
}
