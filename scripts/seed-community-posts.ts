import "dotenv/config";
import { db } from "../src/lib/db";
import { communityPosts, postComments, user } from "../src/lib/schema";
import { randomUUID } from "crypto";

// Create a demo user for seeding
const DEMO_USER_ID = "demo-user-seed";
const DEMO_USER_NAME = "Demo User";
const DEMO_USER_EMAIL = "demo@foodshare.local";

async function seedCommunityPosts() {
  console.log("🌱 Seeding community posts...");

  try {
    // Create or get demo user
    let demoUser = await db.query.user.findFirst({
      where: (users, { eq }) => eq(users.email, DEMO_USER_EMAIL),
    });

    if (!demoUser) {
      console.log("Creating demo user...");
      [demoUser] = await db
        .insert(user)
        .values({
          id: DEMO_USER_ID,
          name: DEMO_USER_NAME,
          email: DEMO_USER_EMAIL,
          emailVerified: false,
        })
        .returning();
    }

    console.log(`Using demo user: ${demoUser.name} (${demoUser.id})`);

    // Check if demo posts already exist
    const existingDemoPosts = await db.query.communityPosts.findMany({
      where: (posts, { eq }) => eq(posts.isDemo, true),
    });

    if (existingDemoPosts.length > 0) {
      console.log(`Found ${existingDemoPosts.length} existing demo posts. Skipping seed.`);
      console.log("To re-seed, delete existing demo posts first.");
      process.exit(0);
    }

    // Seed posts
    const posts = [
      {
        id: randomUUID(),
        userId: demoUser.id,
        authorName: "Sarah L.",
        mood: "full" as const,
        kind: "share" as const,
        body: "Big pot of coconut lentil soup and garlic flatbread up for grabs. Bring a container if you can!",
        location: "13th & P St stoop",
        availableUntil: "Pickup before 8:30 pm",
        tags: ["Veggie friendly", "Warm meal"],
        status: "verified" as const,
        isDemo: true,
      },
      {
        id: randomUUID(),
        userId: demoUser.id,
        authorName: "Ana P.",
        mood: "hungry" as const,
        kind: "request" as const,
        body: "Looking for halal groceries or a hot meal for my family tonight. Any leads nearby?",
        tags: ["Family of four", "Halal"],
        status: "community" as const,
        isDemo: true,
      },
      {
        id: randomUUID(),
        userId: demoUser.id,
        authorName: "Terrance",
        mood: "update" as const,
        kind: "resource" as const,
        body: "Just added Oak Park Community Pantry to the map. Friendly crew and fresh produce every Thursday evening.",
        location: "3725 MLK Jr Blvd",
        tags: ["Community fridge", "Fresh produce"],
        status: "community" as const,
        isDemo: true,
      },
      {
        id: randomUUID(),
        userId: demoUser.id,
        authorName: "Guide Maria",
        mood: "update" as const,
        kind: "update" as const,
        body: "Heads up: Sacred Heart pantry got a surprise delivery of eggs and dairy. They'll close the line at 5:30 pm.",
        location: "Sacred Heart Pantry",
        availableUntil: "Line closes 5:30 pm",
        status: "verified" as const,
        isDemo: true,
      },
      {
        id: randomUUID(),
        userId: demoUser.id,
        authorName: "Ken",
        mood: "full" as const,
        kind: "share" as const,
        body: "Harvested more oranges than I can juice. Porch pickup all evening—bag what you need!",
        location: "24th & Broadway",
        availableUntil: "Available until 10 pm",
        tags: ["Fresh produce"],
        status: "verified" as const,
        isDemo: true,
      },
    ];

    console.log(`Inserting ${posts.length} demo posts...`);
    const insertedPosts = await db.insert(communityPosts).values(posts).returning();

    // Add some demo comments
    const comments = [
      {
        postId: insertedPosts[0].id, // Sarah's soup post
        userId: demoUser.id,
        authorName: "Marcus",
        body: "On my way with bowls for two! Thanks for sharing.",
      },
      {
        postId: insertedPosts[1].id, // Ana's request
        userId: demoUser.id,
        authorName: "Guide Ahmed",
        body: "City Harvest pantry on 21st just restocked halal meats. They're open until 7:30 pm—no appointment needed.",
      },
      {
        postId: insertedPosts[1].id, // Ana's request
        userId: demoUser.id,
        authorName: "Lina",
        body: "I can drop off extra rice and veggies in 20 minutes if that helps!",
      },
      {
        postId: insertedPosts[3].id, // Guide Maria's update
        userId: demoUser.id,
        authorName: "Jasmine",
        body: "Thanks! I grabbed extra cartons—happy to share if anyone can't make it in time.",
      },
    ];

    console.log(`Inserting ${comments.length} demo comments...`);
    await db.insert(postComments).values(comments);

    console.log("✅ Community posts seeded successfully!");
    console.log(`   ${insertedPosts.length} posts created`);
    console.log(`   ${comments.length} comments created`);
    console.log("\nDemo posts are marked with isDemo=true flag.");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding community posts:", error);
    process.exit(1);
  }
}

seedCommunityPosts();
