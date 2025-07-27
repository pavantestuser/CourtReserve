import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, or, inArray } from "drizzle-orm";
import session, { SessionOptions } from "express-session";
import connectPg from "connect-pg-simple";
import { Pool } from "pg";

import {
  users,
  institutions,
  groups,
  courts,
  timeSlots,
  bookings,
  sportsTracking,
  facilities,
  userOrganizations,
  appAdmins,
  organizationAdmins,
  staff,
  sections,
  payments,
  type User,
  type InsertUser,
  type Institution,
  type InsertInstitution,
  type Group,
  type InsertGroup,
  type Court,
  type InsertCourt,
  type TimeSlot,
  type InsertTimeSlot,
  type Booking,
  type InsertBooking,
  type SportsTracking,
  type InsertSportsTracking,
  type Facility,
  type InsertFacility,
  type UserOrganization,
  type InsertUserOrganization,
  type AppAdmin,
  type InsertAppAdmin,
  type OrganizationAdmin,
  type InsertOrganizationAdmin,
  type Staff,
  type InsertStaff,
  type Section,
  type InsertSection,
} from "@shared/schema";

const PostgresSessionStore = connectPg(session);

// Enhanced storage interface for multi-role architecture
export interface IStorage {
  // Institution management
  getInstitutions(): Promise<Institution[]>;
  getInstitutionById(id: string): Promise<Institution | undefined>;
  getInstitutionByCode(code: string): Promise<Institution | undefined>;
  createInstitution(institution: InsertInstitution): Promise<Institution>;
  updateInstitution(id: string, institution: Partial<InsertInstitution>): Promise<Institution | undefined>;
  
  // User management (enhanced for multi-role)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // User roles and organizations
  getUserRoles(userId: string): Promise<UserOrganization[]>;
  getUsersByInstitution(institutionId: string): Promise<User[]>;
  addUserToOrganization(userOrg: InsertUserOrganization): Promise<UserOrganization>;
  removeUserFromOrganization(userId: string, institutionId: string): Promise<boolean>;
  
  // App Admin management
  getAppAdmins(): Promise<AppAdmin[]>;
  createAppAdmin(appAdmin: InsertAppAdmin): Promise<AppAdmin>;
  isAppAdmin(userId: string): Promise<boolean>;
  
  // Organization Admin management
  getOrganizationAdmins(institutionId: string): Promise<OrganizationAdmin[]>;
  createOrganizationAdmin(orgAdmin: InsertOrganizationAdmin): Promise<OrganizationAdmin>;
  isOrganizationAdmin(userId: string, institutionId: string): Promise<boolean>;
  
  // Staff management
  getStaff(institutionId: string): Promise<Staff[]>;
  createStaff(staffMember: InsertStaff): Promise<Staff>;
  getStaffPermissions(userId: string, institutionId: string): Promise<Staff | undefined>;
  
  // Group management
  getGroupsByInstitution(institutionId: string): Promise<Group[]>;
  getGroupById(id: string): Promise<Group | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(id: string, group: Partial<InsertGroup>): Promise<Group | undefined>;
  
  // Facility management
  getFacilitiesByInstitution(institutionId: string): Promise<Facility[]>;
  getFacilityById(id: string): Promise<Facility | undefined>;
  createFacility(facility: InsertFacility): Promise<Facility>;
  updateFacility(id: string, facility: Partial<InsertFacility>): Promise<Facility | undefined>;
  deleteFacility(id: string): Promise<boolean>;
  
  // Court management
  getCourts(institutionId?: string): Promise<Court[]>;
  getCourtById(id: string): Promise<Court | undefined>;
  getCourtsByInstitution(institutionId: string): Promise<Court[]>;
  getCourtsByFacility(facilityId: string): Promise<Court[]>;
  createCourt(court: InsertCourt): Promise<Court>;
  updateCourt(id: string, court: Partial<InsertCourt>): Promise<Court | undefined>;
  deleteCourt(id: string): Promise<boolean>;
  
  // Time slot management
  getTimeSlotsByCourtAndDate(courtId: string, date: string): Promise<TimeSlot[]>;
  getTimeSlotById(id: string): Promise<TimeSlot | undefined>;
  getAvailableTimeSlots(institutionId: string, userId: string, date: string): Promise<TimeSlot[]>;
  createTimeSlot(timeSlot: InsertTimeSlot): Promise<TimeSlot>;
  updateTimeSlot(id: string, timeSlot: Partial<InsertTimeSlot>): Promise<TimeSlot | undefined>;
  deleteTimeSlot(id: string): Promise<boolean>;
  
  // Booking management
  getBookingsByUser(userId: string): Promise<Booking[]>;
  getBookingById(id: string): Promise<Booking | undefined>;
  getBookingsByDate(date: string): Promise<Booking[]>;
  getBookingsByCourtAndDate(courtId: string, date: string): Promise<Booking[]>;
  getUserBookingsForDate(userId: string, date: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking | undefined>;
  
  // Sports tracking
  getSportsTrackingByUser(userId: string): Promise<SportsTracking[]>;
  createSportsTracking(tracking: InsertSportsTracking): Promise<SportsTracking>;
  
  // Session store
  sessionStore: session.Store;
  
  // Utilities
  generateStudentId(institutionCode: string, groupName: string): Promise<string>;
  validateBookingPermissions(userId: string, timeSlotId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  private db;
  public sessionStore: session.Store;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is required");
    }

    // Set up database connection pool
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }, // Required for Supabase
    });
    
    this.db = drizzle(pool);

    // Set up session store
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });

    this.initializeDefaultData();
  }

  private async initializeDefaultData() {
    try {
      // Check if we already have data
      const existingInstitutions = await this.getInstitutions();
      if (existingInstitutions.length > 0) return;

      // Create default institution
      const defaultInstitution = await this.createInstitution({
        name: "Sample College",
        code: "COLA",
        type: "private",
        address: "123 University Ave",
        contactEmail: "admin@samplecollege.edu",
        contactPhone: "+1-555-0100",
        isActive: true,
      });

      // Create default groups
      await this.createGroup({
        institutionId: defaultInstitution.id,
        name: "A1",
        description: "First year, Section A1",
        isActive: true,
      });

      await this.createGroup({
        institutionId: defaultInstitution.id,
        name: "A2", 
        description: "First year, Section A2",
        isActive: true,
      });

      // Create default facilities
      const badmintonFacility = await this.createFacility({
        institutionId: defaultInstitution.id,
        name: "Badminton",
        description: "Indoor badminton courts",
        isActive: true,
      });

      const basketballFacility = await this.createFacility({
        institutionId: defaultInstitution.id,
        name: "Basketball",
        description: "Indoor basketball courts",
        isActive: true,
      });

      // Create default courts
      await this.createCourt({
        facilityId: badmintonFacility.id,
        institutionId: defaultInstitution.id,
        name: "Badminton Court 1",
        courtType: "indoor",
        location: "Sports Complex A",
        playersRequired: 4,
        availableToPublic: false,
        hourlyRate: "25.00",
        isActive: true,
      });

      await this.createCourt({
        facilityId: basketballFacility.id,
        institutionId: defaultInstitution.id,
        name: "Basketball Court 1",
        courtType: "indoor", 
        location: "Sports Complex B",
        playersRequired: 10,
        availableToPublic: true,
        hourlyRate: "50.00",
        isActive: true,
      });

      console.log("Default data initialized successfully");
    } catch (error) {
      console.error("Error initializing default data:", error);
    }
  }

  // Institution management
  async getInstitutions(): Promise<Institution[]> {
    return await this.db.select().from(institutions);
  }

  async getInstitutionById(id: string): Promise<Institution | undefined> {
    const result = await this.db.select().from(institutions).where(eq(institutions.id, id));
    return result[0];
  }

  async getInstitutionByCode(code: string): Promise<Institution | undefined> {
    const result = await this.db.select().from(institutions).where(eq(institutions.code, code));
    return result[0];
  }

  async createInstitution(institution: InsertInstitution): Promise<Institution> {
    const result = await this.db.insert(institutions).values(institution).returning();
    return result[0];
  }

  async updateInstitution(id: string, institution: Partial<InsertInstitution>): Promise<Institution | undefined> {
    const result = await this.db.update(institutions).set(institution).where(eq(institutions.id, id)).returning();
    return result[0];
  }

  // User management
  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const result = await this.db.update(users).set(user).where(eq(users.id, id)).returning();
    return result[0];
  }

  // User roles and organizations
  async getUserRoles(userId: string): Promise<UserOrganization[]> {
    return await this.db.select().from(userOrganizations).where(eq(userOrganizations.userId, userId));
  }

  async getUsersByInstitution(institutionId: string): Promise<User[]> {
    const userOrgResults = await this.db
      .select({ userId: userOrganizations.userId })
      .from(userOrganizations)
      .where(eq(userOrganizations.institutionId, institutionId));
    
    if (userOrgResults.length === 0) return [];
    
    const userIds = userOrgResults.map(uo => uo.userId);
    return await this.db.select().from(users).where(inArray(users.id, userIds));
  }

  async addUserToOrganization(userOrg: InsertUserOrganization): Promise<UserOrganization> {
    const result = await this.db.insert(userOrganizations).values(userOrg).returning();
    return result[0];
  }

  async removeUserFromOrganization(userId: string, institutionId: string): Promise<boolean> {
    const result = await this.db
      .delete(userOrganizations)
      .where(and(eq(userOrganizations.userId, userId), eq(userOrganizations.institutionId, institutionId)));
    return true;
  }

  // App Admin management
  async getAppAdmins(): Promise<AppAdmin[]> {
    return await this.db.select().from(appAdmins);
  }

  async createAppAdmin(appAdmin: InsertAppAdmin): Promise<AppAdmin> {
    const result = await this.db.insert(appAdmins).values(appAdmin).returning();
    return result[0];
  }

  async isAppAdmin(userId: string): Promise<boolean> {
    const result = await this.db.select().from(appAdmins).where(eq(appAdmins.userId, userId));
    return result.length > 0;
  }

  // Organization Admin management
  async getOrganizationAdmins(institutionId: string): Promise<OrganizationAdmin[]> {
    return await this.db.select().from(organizationAdmins).where(eq(organizationAdmins.institutionId, institutionId));
  }

  async createOrganizationAdmin(orgAdmin: InsertOrganizationAdmin): Promise<OrganizationAdmin> {
    const result = await this.db.insert(organizationAdmins).values(orgAdmin).returning();
    return result[0];
  }

  async isOrganizationAdmin(userId: string, institutionId: string): Promise<boolean> {
    const result = await this.db
      .select()
      .from(organizationAdmins)
      .where(and(eq(organizationAdmins.userId, userId), eq(organizationAdmins.institutionId, institutionId)));
    return result.length > 0;
  }

  // Staff management
  async getStaff(institutionId: string): Promise<Staff[]> {
    return await this.db.select().from(staff).where(eq(staff.institutionId, institutionId));
  }

  async createStaff(staffMember: InsertStaff): Promise<Staff> {
    const result = await this.db.insert(staff).values(staffMember).returning();
    return result[0];
  }

  async getStaffPermissions(userId: string, institutionId: string): Promise<Staff | undefined> {
    const result = await this.db
      .select()
      .from(staff)
      .where(and(eq(staff.userId, userId), eq(staff.institutionId, institutionId)));
    return result[0];
  }

  // Group management
  async getGroupsByInstitution(institutionId: string): Promise<Group[]> {
    return await this.db.select().from(groups).where(eq(groups.institutionId, institutionId));
  }

  async getGroupById(id: string): Promise<Group | undefined> {
    const result = await this.db.select().from(groups).where(eq(groups.id, id));
    return result[0];
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const result = await this.db.insert(groups).values(group).returning();
    return result[0];
  }

  async updateGroup(id: string, group: Partial<InsertGroup>): Promise<Group | undefined> {
    const result = await this.db.update(groups).set(group).where(eq(groups.id, id)).returning();
    return result[0];
  }

  // Facility management
  async getFacilitiesByInstitution(institutionId: string): Promise<Facility[]> {
    return await this.db.select().from(facilities).where(eq(facilities.institutionId, institutionId));
  }

  async getFacilityById(id: string): Promise<Facility | undefined> {
    const result = await this.db.select().from(facilities).where(eq(facilities.id, id));
    return result[0];
  }

  async createFacility(facility: InsertFacility): Promise<Facility> {
    const result = await this.db.insert(facilities).values(facility).returning();
    return result[0];
  }

  async updateFacility(id: string, facility: Partial<InsertFacility>): Promise<Facility | undefined> {
    const result = await this.db.update(facilities).set(facility).where(eq(facilities.id, id)).returning();
    return result[0];
  }

  async deleteFacility(id: string): Promise<boolean> {
    await this.db.delete(facilities).where(eq(facilities.id, id));
    return true;
  }

  // Court management
  async getCourts(institutionId?: string): Promise<Court[]> {
    if (institutionId) {
      return await this.db.select().from(courts).where(eq(courts.institutionId, institutionId));
    }
    return await this.db.select().from(courts);
  }

  async getCourtById(id: string): Promise<Court | undefined> {
    const result = await this.db.select().from(courts).where(eq(courts.id, id));
    return result[0];
  }

  async getCourtsByInstitution(institutionId: string): Promise<Court[]> {
    return await this.db.select().from(courts).where(eq(courts.institutionId, institutionId));
  }

  async getCourtsByFacility(facilityId: string): Promise<Court[]> {
    return await this.db.select().from(courts).where(eq(courts.facilityId, facilityId));
  }

  async createCourt(court: InsertCourt): Promise<Court> {
    const result = await this.db.insert(courts).values(court).returning();
    return result[0];
  }

  async updateCourt(id: string, court: Partial<InsertCourt>): Promise<Court | undefined> {
    const result = await this.db.update(courts).set(court).where(eq(courts.id, id)).returning();
    return result[0];
  }

  async deleteCourt(id: string): Promise<boolean> {
    await this.db.delete(courts).where(eq(courts.id, id));
    return true;
  }

  // Time slot management
  async getTimeSlotsByCourtAndDate(courtId: string, date: string): Promise<TimeSlot[]> {
    return await this.db
      .select()
      .from(timeSlots)
      .where(and(eq(timeSlots.courtId, courtId), eq(timeSlots.date, date)));
  }

  async getTimeSlotById(id: string): Promise<TimeSlot | undefined> {
    const result = await this.db.select().from(timeSlots).where(eq(timeSlots.id, id));
    return result[0];
  }

  async getAvailableTimeSlots(institutionId: string, userId: string, date: string): Promise<TimeSlot[]> {
    // Get user's groups to filter allowed slots
    const userRoles = await this.getUserRoles(userId);
    const userGroupIds = userRoles.map(role => role.groupId).filter(Boolean);

    return await this.db
      .select()
      .from(timeSlots)
      .where(
        and(
          eq(timeSlots.institutionId, institutionId),
          eq(timeSlots.date, date),
          eq(timeSlots.isActive, true)
        )
      );
  }

  async createTimeSlot(timeSlot: InsertTimeSlot): Promise<TimeSlot> {
    const result = await this.db.insert(timeSlots).values(timeSlot).returning();
    return result[0];
  }

  async updateTimeSlot(id: string, timeSlot: Partial<InsertTimeSlot>): Promise<TimeSlot | undefined> {
    const result = await this.db.update(timeSlots).set(timeSlot).where(eq(timeSlots.id, id)).returning();
    return result[0];
  }

  async deleteTimeSlot(id: string): Promise<boolean> {
    await this.db.delete(timeSlots).where(eq(timeSlots.id, id));
    return true;
  }

  // Booking management
  async getBookingsByUser(userId: string): Promise<Booking[]> {
    return await this.db.select().from(bookings).where(eq(bookings.userId, userId));
  }

  async getBookingById(id: string): Promise<Booking | undefined> {
    const result = await this.db.select().from(bookings).where(eq(bookings.id, id));
    return result[0];
  }

  async getBookingsByDate(date: string): Promise<Booking[]> {
    return await this.db.select().from(bookings).where(eq(bookings.date, date));
  }

  async getBookingsByCourtAndDate(courtId: string, date: string): Promise<Booking[]> {
    return await this.db
      .select()
      .from(bookings)
      .where(and(eq(bookings.courtId, courtId), eq(bookings.date, date)));
  }

  async getUserBookingsForDate(userId: string, date: string): Promise<Booking[]> {
    return await this.db
      .select()
      .from(bookings)
      .where(and(eq(bookings.userId, userId), eq(bookings.date, date)));
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const result = await this.db.insert(bookings).values(booking).returning();
    return result[0];
  }

  async updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking | undefined> {
    const result = await this.db.update(bookings).set(booking).where(eq(bookings.id, id)).returning();
    return result[0];
  }

  // Sports tracking
  async getSportsTrackingByUser(userId: string): Promise<SportsTracking[]> {
    return await this.db.select().from(sportsTracking).where(eq(sportsTracking.userId, userId));
  }

  async createSportsTracking(tracking: InsertSportsTracking): Promise<SportsTracking> {
    const result = await this.db.insert(sportsTracking).values(tracking).returning();
    return result[0];
  }

  // Utilities
  async generateStudentId(institutionCode: string, groupName: string): Promise<string> {
    // Get existing student IDs for this institution and group
    const userOrgRecords = await this.db
      .select()
      .from(userOrganizations)
      .where(and(
        eq(userOrganizations.role, "member"),
        // Add more specific filtering if needed
      ));

    // Generate next sequential number
    const existingIds = userOrgRecords
      .map(record => record.studentId)
      .filter(id => id && id.startsWith(`${institutionCode}_${groupName}_`));

    const nextNumber = existingIds.length + 1;
    return `${institutionCode}_${groupName}_${nextNumber.toString().padStart(3, '0')}`;
  }

  async validateBookingPermissions(userId: string, timeSlotId: string): Promise<boolean> {
    const timeSlot = await this.getTimeSlotById(timeSlotId);
    if (!timeSlot) return false;

    // Get user's roles and groups
    const userRoles = await this.getUserRoles(userId);
    const userGroupIds = userRoles.map(role => role.groupId).filter(Boolean);

    // Check if time slot allows user's groups
    if (timeSlot.allowedGroups && timeSlot.allowedGroups.length > 0) {
      return userGroupIds.some(groupId => timeSlot.allowedGroups?.includes(groupId!));
    }

    return true; // If no group restrictions, allow booking
  }
}

export const storage = new DatabaseStorage();