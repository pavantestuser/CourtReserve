import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Institution management
export const institutions = pgTable("institutions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(), // e.g., "COLA"
  type: text("type").notNull().default("private"), // "private" or "public"
  address: text("address"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Groups/Sections for organizing students
export const groups = pgTable("groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id").references(() => institutions.id).notNull(),
  name: text("name").notNull(), // e.g., "A1", "A2", "B1"
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced user management - base user without organization assignment
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  isPublicUser: boolean("is_public_user").notNull().default(true), // Can book public slots
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// App-level administrators (super admins)
export const appAdmins = pgTable("app_admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User-Organization mapping with roles (many-to-many)
export const userOrganizations = pgTable("user_organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  institutionId: varchar("institution_id").references(() => institutions.id).notNull(),
  role: text("role").notNull(), // "org_admin", "staff", "member"
  groupId: varchar("group_id").references(() => groups.id),
  studentId: text("student_id"), // Auto-generated for students: COLA_A1_001
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Organization administrators
export const organizationAdmins = pgTable("organization_admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  institutionId: varchar("institution_id").references(() => institutions.id).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Staff members with specific permissions
export const staff = pgTable("staff", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  institutionId: varchar("institution_id").references(() => institutions.id).notNull(),
  canManageSections: boolean("can_manage_sections").notNull().default(false),
  canManageFacilities: boolean("can_manage_facilities").notNull().default(false),
  canManageUsers: boolean("can_manage_users").notNull().default(false),
  canAddSlots: boolean("can_add_slots").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sections for user organization within institutions
export const sections = pgTable("sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id").references(() => institutions.id).notNull(),
  name: text("name").notNull(),
  assignedToUserId: varchar("assigned_to_user_id").references(() => users.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Facilities (e.g., Badminton, Basketball) - groups related courts
export const facilities = pgTable("facilities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id").references(() => institutions.id).notNull(),
  name: text("name").notNull(), // e.g., "Badminton", "Basketball", "Tennis"
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced court management - now references facilities
export const courts = pgTable("courts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").references(() => facilities.id).notNull(),
  institutionId: varchar("institution_id").references(() => institutions.id).notNull(),
  name: text("name").notNull(),
  courtType: text("court_type"), // "indoor", "outdoor", "synthetic"
  location: text("location").notNull(),
  description: text("description"),
  playersRequired: integer("players_required").notNull().default(4), // 2 or 4 players per game
  availableToPublic: boolean("available_to_public").notNull().default(false),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced slot management
export const timeSlots = pgTable("time_slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id").references(() => institutions.id).notNull(),
  courtId: varchar("court_id").references(() => courts.id).notNull(),
  sportType: text("sport_type").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  startTime: text("start_time").notNull(), // HH:MM format
  endTime: text("end_time").notNull(), // HH:MM format
  maxPlayers: integer("max_players").notNull(),
  currentBookings: integer("current_bookings").notNull().default(0),
  allowedGroups: text("allowed_groups").array(), // Array of group IDs
  oneSlotPerDay: boolean("one_slot_per_day").notNull().default(false),
  isRepeating: boolean("is_repeating").notNull().default(false),
  repeatDays: text("repeat_days").array(), // Array of weekday numbers
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced booking management
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  institutionId: varchar("institution_id").references(() => institutions.id).notNull(),
  courtId: varchar("court_id").references(() => courts.id).notNull(),
  timeSlotId: varchar("time_slot_id").references(() => timeSlots.id).notNull(),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  status: text("status").notNull().default("confirmed"), // "confirmed", "cancelled", "completed"
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  playersCount: integer("players_count").notNull().default(1),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sports tracking remains similar but enhanced
export const sportsTracking = pgTable("sports_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  institutionId: varchar("institution_id").references(() => institutions.id).notNull(),
  sportType: text("sport_type").notNull(),
  courtId: varchar("court_id").references(() => courts.id),
  date: text("date").notNull(),
  duration: integer("duration").notNull(), // in minutes
  playersCount: integer("players_count").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payments for slot bookings (optional feature)
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => bookings.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // "pending", "paid", "failed"
  paymentMethod: text("payment_method"), // "cash", "card", "upi", etc.
  transactionId: text("transaction_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for new tables
export const insertInstitutionSchema = createInsertSchema(institutions).omit({
  id: true,
  createdAt: true,
});

export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertAppAdminSchema = createInsertSchema(appAdmins).omit({
  id: true,
  createdAt: true,
});

export const insertUserOrganizationSchema = createInsertSchema(userOrganizations).omit({
  id: true,
  createdAt: true,
  studentId: true, // Auto-generated
});

export const insertOrganizationAdminSchema = createInsertSchema(organizationAdmins).omit({
  id: true,
  createdAt: true,
});

export const insertStaffSchema = createInsertSchema(staff).omit({
  id: true,
  createdAt: true,
});

export const insertSectionSchema = createInsertSchema(sections).omit({
  id: true,
  createdAt: true,
});

export const insertFacilitySchema = createInsertSchema(facilities).omit({
  id: true,
  createdAt: true,
});

export const insertCourtSchema = createInsertSchema(courts).omit({
  id: true,
  createdAt: true,
});

export const insertTimeSlotSchema = createInsertSchema(timeSlots).omit({
  id: true,
  createdAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

export const insertSportsTrackingSchema = createInsertSchema(sportsTracking).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

// Types - Enhanced with new entities
export type Institution = typeof institutions.$inferSelect;
export type InsertInstitution = z.infer<typeof insertInstitutionSchema>;

export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type AppAdmin = typeof appAdmins.$inferSelect;
export type InsertAppAdmin = z.infer<typeof insertAppAdminSchema>;

export type UserOrganization = typeof userOrganizations.$inferSelect;
export type InsertUserOrganization = z.infer<typeof insertUserOrganizationSchema>;

export type OrganizationAdmin = typeof organizationAdmins.$inferSelect;
export type InsertOrganizationAdmin = z.infer<typeof insertOrganizationAdminSchema>;

export type Staff = typeof staff.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;

export type Section = typeof sections.$inferSelect;
export type InsertSection = z.infer<typeof insertSectionSchema>;

export type Facility = typeof facilities.$inferSelect;
export type InsertFacility = z.infer<typeof insertFacilitySchema>;

export type Court = typeof courts.$inferSelect;
export type InsertCourt = z.infer<typeof insertCourtSchema>;

export type TimeSlot = typeof timeSlots.$inferSelect;
export type InsertTimeSlot = z.infer<typeof insertTimeSlotSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type SportsTracking = typeof sportsTracking.$inferSelect;
export type InsertSportsTracking = z.infer<typeof insertSportsTrackingSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
