import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, MapPin } from "lucide-react";

const demoStories = [
  {
    id: "story-1",
    author: "Maria G.",
    role: "Parent, San Jose",
    summary:
      "“FoodShare helped me find a pantry just 5 minutes away that offers fresh produce every Tuesday. My family has healthy meals again.”",
  },
  {
    id: "story-2",
    author: "Jacob L.",
    role: "Veteran, Sunnyvale",
    summary:
      "“I was hesitant to ask for help, but the FoodShare chat connected me with local programs that understood my situation.”",
  },
  {
    id: "story-3",
    author: "Danielle T.",
    role: "Volunteer, Santa Clara",
    summary:
      "“Volunteering through FoodShare introduced me to neighbours I never knew. We’re building a real community.”",
  },
];

const localPrograms = [
  {
    id: "program-1",
    name: "Family Grocery Night",
    host: "Sacred Heart Community Service",
    schedule: "Wednesdays • 5:00 – 7:30 PM",
    location: "1381 S 1st St, San Jose, CA",
    tags: ["Fresh Produce", "Kid Friendly"],
  },
  {
    id: "program-2",
    name: "Weekend Community Meals",
    host: "Loaves & Fishes Family Kitchen",
    schedule: "Saturdays • 11:30 AM – 1:30 PM",
    location: "50 Washington St, San Jose, CA",
    tags: ["Hot Meals", "Takeaway"],
  },
  {
    id: "program-3",
    name: "Nutrition & Wellness Workshops",
    host: "Second Harvest of Silicon Valley",
    schedule: "First Thursday • 6:00 – 7:00 PM",
    location: "Virtual + In-person",
    tags: ["Education", "Recipes"],
  },
];

export default function CommunityPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 pb-12 md:py-10">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Community
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Stories and programs that keep our community fed
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Hear from neighbors using FoodShare today and explore local programs
          you can join. These examples are curated to inspire what&apos;s possible.
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h2 className="text-xl font-semibold">Community Stories</h2>
        </div>
        <div className="grid gap-4">
          {demoStories.map((story) => (
            <Card key={story.id} className="rounded-3xl border border-border/60 bg-card/95 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">{story.author}</CardTitle>
                <CardDescription>{story.role}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{story.summary}</p>
                <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Demo story for Phase 1
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <h2 className="text-xl font-semibold">Local Programs</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {localPrograms.map((program) => (
            <Card key={program.id} className="rounded-3xl border border-border/60 bg-card/95 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold leading-tight">
                  {program.name}
                </CardTitle>
                <CardDescription>{program.host}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>{program.schedule}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{program.location}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {program.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="rounded-full border-primary/20 bg-primary/5 text-primary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  These listings showcase how FoodShare can highlight programs in future phases.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
