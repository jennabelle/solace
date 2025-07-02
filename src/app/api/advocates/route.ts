import db from "../../../db";
import { advocates, specialties, advocateSpecialties } from "../../../db/schema";
import { sql, eq, or, like, ilike, inArray } from 'drizzle-orm';

export async function GET(request) {
  // Parse query parameters from the URL
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const search = searchParams.get('search') || '';

  // Calculate offset for pagination
  const offset = (page - 1) * limit;

  // Build search conditions
  const searchConditions = [];
  if (search.trim()) {
    const searchPattern = `%${search.toLowerCase()}%`;
    searchConditions.push(
      or(
        ilike(advocates.firstName, searchPattern),
        ilike(advocates.lastName, searchPattern),
        ilike(advocates.city, searchPattern),
        ilike(advocates.degree, searchPattern),
        sql`${advocates.yearsOfExperience}::text LIKE ${searchPattern}`,
        ilike(specialties.name, searchPattern)
      )
    );
  }

  // Build base query for advocates
  let baseQuery = db
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
    .leftJoin(specialties, eq(advocateSpecialties.specialtyId, specialties.id));

  // Apply search conditions if they exist
  if (searchConditions.length > 0) {
    baseQuery = baseQuery.where(searchConditions[0]);
  }

  // Get distinct advocate IDs that match search criteria (for pagination count)
  let countQuery = db
    .selectDistinct({ id: advocates.id })
    .from(advocates)
    .leftJoin(advocateSpecialties, eq(advocates.id, advocateSpecialties.advocateId))
    .leftJoin(specialties, eq(advocateSpecialties.specialtyId, specialties.id));

  if (searchConditions.length > 0) {
    countQuery = countQuery.where(searchConditions[0]);
  }

  const countResult = await countQuery;
  const totalItems = countResult.length;

  // Get paginated advocates with their specialties, using DISTINCT to avoid duplicates in pagination
  const advocateIds = await db
    .selectDistinct({ id: advocates.id })
    .from(advocates)
    .leftJoin(advocateSpecialties, eq(advocates.id, advocateSpecialties.advocateId))
    .leftJoin(specialties, eq(advocateSpecialties.specialtyId, specialties.id))
    .where(searchConditions.length > 0 ? searchConditions[0] : undefined)
    .limit(limit)
    .offset(offset);

  // Now get full data for these specific advocate IDs
  const advocatesWithSpecialties = advocateIds.length > 0 ? await db
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
    .where(inArray(advocates.id, advocateIds.map(a => a.id))) : [];

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
