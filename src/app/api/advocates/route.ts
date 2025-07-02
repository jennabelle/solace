import db from "../../../db";
import { advocates, specialties, advocateSpecialties } from "../../../db/schema";
import { sql, eq } from 'drizzle-orm';

export async function GET(request) {
  // Parse query parameters from the URL
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  // Calculate offset for pagination
  const offset = (page - 1) * limit;

  // Get the total count of records
  const countResult = await db.select({ count: sql`count(*)` }).from(advocates);
  const totalItems = Number(countResult[0].count);

  // Get paginated advocates with their specialties
  const advocatesWithSpecialties = await db
    .select({
      id: advocates.id,
      firstName: advocates.firstName,
      lastName: advocates.lastName,
      city: advocates.city,
      degree: advocates.degree,
      yearsOfExperience: advocates.yearsOfExperience,
      phoneNumber: advocates.phoneNumber,
      createdAt: advocates.createdAt,
      specialtyName: specialties.name,
    })
    .from(advocates)
    .leftJoin(advocateSpecialties, eq(advocates.id, advocateSpecialties.advocateId))
    .leftJoin(specialties, eq(advocateSpecialties.specialtyId, specialties.id))
    .limit(limit)
    .offset(offset);

  // Group specialties by advocate
  const advocatesMap = new Map();
  
  for (const row of advocatesWithSpecialties) {
    const advocateId = row.id;
    
    if (!advocatesMap.has(advocateId)) {
      advocatesMap.set(advocateId, {
        id: row.id,
        firstName: row.firstName,
        lastName: row.lastName,
        city: row.city,
        degree: row.degree,
        yearsOfExperience: row.yearsOfExperience,
        phoneNumber: row.phoneNumber,
        createdAt: row.createdAt,
        specialties: [],
      });
    }
    
    if (row.specialtyName) {
      advocatesMap.get(advocateId).specialties.push(row.specialtyName);
    }
  }

  const data = Array.from(advocatesMap.values());

  // Calculate pagination metadata
  const totalPages = Math.ceil(totalItems / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return Response.json({
    data,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage,
      hasPreviousPage
    }
  });
}
