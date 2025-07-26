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

// Enhanced user management
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("student"), // "super_admin", "staff", "student", "public_user"
  institutionId: varchar("institution_id").references(() => institutions.id),
  groupId: varchar("group_id").references(() => groups.id),
  studentId: text("student_id"), // Auto-generated for students: COLA_A1_001
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced court management
export const courts = pgTable("courts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id").references(() => institutions.id).notNull(),
  name: text("name").notNull(),
  sportType: text("sport_type").notNull(), // "tennis", "basketball", "football", "badminton"
  courtType: text("court_type"), // "indoor", "outdoor", "synthetic"
  location: text("location").notNull(),
  description: text("description"),
  capacity: integer("capacity").notNull().default(4), // Max players per slot
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

// Insert schemas
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
  studentId: true, // Auto-generated
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

// Types
export type Institution = typeof institutions.$inferSelect;
export type InsertInstitution = z.infer<typeof insertInstitutionSchema>;
export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Court = typeof courts.$inferSelect;
export type InsertCourt = z.infer<typeof insertCourtSchema>;
export type TimeSlot = typeof timeSlots.$inferSelect;
export type InsertTimeSlot = z.infer<typeof insertTimeSlotSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type SportsTracking = typeof sportsTracking.$inferSelect;
export type InsertSportsTracking = z.infer<typeof insertSportsTrackingSchema>;
