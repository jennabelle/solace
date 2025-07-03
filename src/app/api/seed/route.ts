import { seedDatabase } from "../../../db/seed/advocates";

export async function POST() {
  try {
    await seedDatabase();
    return Response.json({ message: "Database seeded successfully!" });
  } catch (error) {
    console.error("Seeding failed:", error);
    return Response.json({ error: "Seeding failed" }, { status: 500 });
  }
}
