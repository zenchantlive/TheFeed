import { db } from "../src/lib/db";
import { foodBanks, type HoursType } from "../src/lib/schema";

type SeedFoodBank = typeof foodBanks.$inferInsert;

const defaultHours: HoursType = {
  Monday: { open: "9:00 AM", close: "5:00 PM" },
  Tuesday: { open: "9:00 AM", close: "5:00 PM" },
  Wednesday: { open: "9:00 AM", close: "5:00 PM" },
  Thursday: { open: "9:00 AM", close: "5:00 PM" },
  Friday: { open: "9:00 AM", close: "5:00 PM" },
  Saturday: { open: "10:00 AM", close: "2:00 PM" },
  Sunday: { open: "Closed", close: "Closed", closed: true },
};

const seedData: SeedFoodBank[] = [
  {
    name: "Sacred Heart Community Service",
    address: "1381 S 1st St",
    city: "San Jose",
    state: "CA",
    zipCode: "95110",
    latitude: 37.3161,
    longitude: -121.8728,
    phone: "(408) 278-2160",
    website: "https://www.sacredheartcs.org/",
    description:
      "Provides food pantry services, hot meals, and support programs for families in need.",
    services: ["Food Pantry", "Hot Meals", "Case Management"],
    hours: {
      ...defaultHours,
      Sunday: { open: "Closed", close: "Closed", closed: true },
    },
  },
  {
    name: "Second Harvest of Silicon Valley",
    address: "750 Curtner Ave",
    city: "San Jose",
    state: "CA",
    zipCode: "95125",
    latitude: 37.2963,
    longitude: -121.8876,
    phone: "(408) 266-8866",
    website: "https://www.shfb.org/",
    description:
      "Distributes nutritious groceries through community partners and provides nutrition education.",
    services: ["Food Distribution", "Nutrition Education", "CalFresh Assistance"],
    hours: {
      ...defaultHours,
      Saturday: { open: "9:00 AM", close: "1:00 PM" },
      Sunday: { open: "Closed", close: "Closed", closed: true },
    },
  },
  {
    name: "Cityteam San Jose",
    address: "1174 Old Bayshore Hwy",
    city: "San Jose",
    state: "CA",
    zipCode: "95112",
    latitude: 37.3566,
    longitude: -121.8966,
    phone: "(408) 232-5600",
    website: "https://www.cityteam.org/san-jose/",
    description:
      "Offers hot meals, shelter services, and supportive programs for low-income individuals.",
    services: ["Hot Meals", "Shelter", "Clothing"],
    hours: {
      ...defaultHours,
      Saturday: { open: "10:00 AM", close: "3:00 PM" },
      Sunday: { open: "10:00 AM", close: "3:00 PM" },
    },
  },
  {
    name: "Loaves & Fishes Family Kitchen",
    address: "50 Washington St",
    city: "San Jose",
    state: "CA",
    zipCode: "95112",
    latitude: 37.3497,
    longitude: -121.9036,
    phone: "(408) 998-1500",
    website: "https://www.loavesfishes.org/",
    description:
      "Provides hot, nutritious meals to low-income and homeless individuals and families.",
    services: ["Hot Meals", "Mobile Meals", "Senior Nutrition"],
    hours: {
      ...defaultHours,
      Saturday: { open: "10:00 AM", close: "2:00 PM" },
      Sunday: { open: "Closed", close: "Closed", closed: true },
    },
  },
  {
    name: "Martha's Kitchen",
    address: "311 Willow St",
    city: "San Jose",
    state: "CA",
    zipCode: "95110",
    latitude: 37.3098,
    longitude: -121.8879,
    phone: "(408) 293-6111",
    website: "https://www.marthas-kitchen.org/",
    description:
      "Serves hot meals and distributes groceries through partner organizations.",
    services: ["Hot Meals", "Groceries", "Nutrition Programs"],
    hours: {
      ...defaultHours,
      Sunday: { open: "Closed", close: "Closed", closed: true },
    },
  },
  {
    name: "St. Joseph's Family Center",
    address: "7950 Church St",
    city: "Gilroy",
    state: "CA",
    zipCode: "95020",
    latitude: 37.0148,
    longitude: -121.5853,
    phone: "(408) 842-6662",
    website: "https://stjosephsgilroy.org/",
    description:
      "Provides food pantry services, rent assistance, and supportive services for families.",
    services: ["Food Pantry", "Financial Assistance", "Case Management"],
    hours: {
      ...defaultHours,
      Saturday: { open: "9:00 AM", close: "12:00 PM" },
      Sunday: { open: "Closed", close: "Closed", closed: true },
    },
  },
  {
    name: "Sunnyvale Community Services",
    address: "1160 Kern Ave",
    city: "Sunnyvale",
    state: "CA",
    zipCode: "94085",
    latitude: 37.3786,
    longitude: -122.0174,
    phone: "(408) 738-4321",
    website: "https://svcommunityservices.org/",
    description:
      "Offers food assistance, case management, and financial aid for Sunnyvale residents.",
    services: ["Food Pantry", "Case Management", "Financial Assistance"],
    hours: {
      ...defaultHours,
      Sunday: { open: "Closed", close: "Closed", closed: true },
    },
  },
  {
    name: "Milpitas Food Pantry",
    address: "1440 S Main St",
    city: "Milpitas",
    state: "CA",
    zipCode: "95035",
    latitude: 37.4123,
    longitude: -121.8822,
    phone: "(408) 946-5564",
    website: "https://milpitasfoodpantry.org/",
    description:
      "Provides supplemental food to low-income individuals and families in Milpitas.",
    services: ["Food Pantry", "Senior Food Delivery", "Holiday Programs"],
    hours: {
      ...defaultHours,
      Sunday: { open: "Closed", close: "Closed", closed: true },
    },
  },
  {
    name: "North Peninsula Food Pantry & Dining Center",
    address: "31 Bepler St",
    city: "Daly City",
    state: "CA",
    zipCode: "94014",
    latitude: 37.6862,
    longitude: -122.4697,
    phone: "(650) 994-5150",
    website: "https://www.npdp.org/",
    description:
      "Offers groceries and hot meals to residents of Daly City and surrounding communities.",
    services: ["Food Pantry", "Hot Meals", "Senior Services"],
    hours: {
      ...defaultHours,
      Saturday: { open: "10:00 AM", close: "1:00 PM" },
      Sunday: { open: "Closed", close: "Closed", closed: true },
    },
  },
  {
    name: "San Francisco-Marin Food Bank",
    address: "900 Pennsylvania Ave",
    city: "San Francisco",
    state: "CA",
    zipCode: "94107",
    latitude: 37.7516,
    longitude: -122.3948,
    phone: "(415) 282-1900",
    website: "https://www.sfmfoodbank.org/",
    description:
      "Distributes food to community partners and provides direct services through pop-up pantries.",
    services: ["Food Distribution", "Pop-Up Pantries", "CalFresh Assistance"],
    hours: {
      ...defaultHours,
      Saturday: { open: "9:00 AM", close: "1:00 PM" },
      Sunday: { open: "Closed", close: "Closed", closed: true },
    },
  },
];

async function seed() {
  try {
    await db.insert(foodBanks).values(seedData);
    console.log("✅ Seeded food banks successfully.");
  } catch (error) {
    console.error("❌ Failed to seed food banks", error);
    process.exit(1);
  }
}

seed().then(() => process.exit(0));
