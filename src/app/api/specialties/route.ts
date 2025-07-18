import db from "../../../db";
import { specialties } from "../../../db/schema";

// New endpoint to get all specialties
export async function GET(request) {
  const allSpecialties = await db
    .select({ id: specialties.id, name: specialties.name })
    .from(specialties)
    .orderBy(specialties.name);

  return Response.json({ data: allSpecialties });
}