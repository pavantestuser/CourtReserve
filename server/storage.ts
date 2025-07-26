import { 
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
  type InsertSportsTracking
} from "@shared/schema";
import { randomUUID } from "crypto";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Institution management
  getInstitutions(): Promise<Institution[]>;
  getInstitutionById(id: string): Promise<Institution | undefined>;
  getInstitutionByCode(code: string): Promise<Institution | undefined>;
  createInstitution(institution: InsertInstitution): Promise<Institution>;
  updateInstitution(id: string, institution: Partial<InsertInstitution>): Promise<Institution | undefined>;
  
  // Group management
  getGroupsByInstitution(institutionId: string): Promise<Group[]>;
  getGroupById(id: string): Promise<Group | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(id: string, group: Partial<InsertGroup>): Promise<Group | undefined>;
  
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsersByInstitution(institutionId: string): Promise<User[]>;
  getUsersByGroup(groupId: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  generateStudentId(institutionCode: string, groupName: string): Promise<string>;
  
  // Court management
  getCourts(institutionId?: string): Promise<Court[]>;
  getCourtById(id: string): Promise<Court | undefined>;
  getCourtsByInstitution(institutionId: string): Promise<Court[]>;
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
  
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private institutions: Map<string, Institution>;
  private groups: Map<string, Group>;
  private users: Map<string, User>;
  private courts: Map<string, Court>;
  private timeSlots: Map<string, TimeSlot>;
  private bookings: Map<string, Booking>;
  private sportsTracking: Map<string, SportsTracking>;
  private studentIdCounters: Map<string, number>; // Track student ID sequences per group
  public sessionStore: session.SessionStore;

  constructor() {
    this.institutions = new Map();
    this.groups = new Map();
    this.users = new Map();
    this.courts = new Map();
    this.timeSlots = new Map();
    this.bookings = new Map();
    this.sportsTracking = new Map();
    this.studentIdCounters = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Initialize with default data
    this.initializeDefaultData();
  }

  private async initializeDefaultData() {
    // Create default institution
    const defaultInstitution = await this.createInstitution({
      name: "Sample Sports College",
      code: "SSC",
      type: "private",
      address: "123 Sports Avenue, Athletic City",
      contactEmail: "admin@samplecollege.edu",
      contactPhone: "+1-555-SPORTS",
      isActive: true,
    });

    // Create default groups
    const groupA1 = await this.createGroup({
      institutionId: defaultInstitution.id,
      name: "A1",
      description: "First year, Section A1",
      isActive: true,
    });

    const groupA2 = await this.createGroup({
      institutionId: defaultInstitution.id,
      name: "A2", 
      description: "First year, Section A2",
      isActive: true,
    });

    // Create default admin/staff user (password will be hashed during registration)
    // Note: Password hashing will be handled by auth endpoints

    // Create default courts
    const defaultCourts: InsertCourt[] = [
      {
        institutionId: defaultInstitution.id,
        name: "Tennis Court A",
        sportType: "tennis",
        courtType: "outdoor",
        location: "Sports Complex - Level 1",
        description: "Professional tennis court with synthetic surface",
        capacity: 4,
        hourlyRate: "25.00",
        isActive: true,
      },
      {
        institutionId: defaultInstitution.id,
        name: "Basketball Court 1",
        sportType: "basketball",
        courtType: "indoor",
        location: "Main Gymnasium",
        description: "Indoor basketball court with wooden flooring",
        capacity: 10,
        hourlyRate: "30.00",
        isActive: true,
      },
      {
        institutionId: defaultInstitution.id,
        name: "Football Field A",
        sportType: "football",
        courtType: "outdoor",
        location: "Outdoor Sports Area",
        description: "Regulation size football field with natural grass",
        capacity: 22,
        hourlyRate: "50.00",
        isActive: true,
      },
      {
        institutionId: defaultInstitution.id,
        name: "Badminton Court 1",
        sportType: "badminton",
        courtType: "indoor",
        location: "Indoor Sports Hall",
        description: "Professional badminton court with wooden flooring",
        capacity: 4,
        hourlyRate: "20.00",
        isActive: true,
      },
    ];

    for (const court of defaultCourts) {
      await this.createCourt(court);
    }
  }

  // Institution methods
  async getInstitutions(): Promise<Institution[]> {
    return Array.from(this.institutions.values()).filter(inst => inst.isActive);
  }

  async getInstitutionById(id: string): Promise<Institution | undefined> {
    return this.institutions.get(id);
  }

  async getInstitutionByCode(code: string): Promise<Institution | undefined> {
    return Array.from(this.institutions.values()).find(inst => inst.code === code);
  }

  async createInstitution(insertInstitution: InsertInstitution): Promise<Institution> {
    const id = randomUUID();
    const institution: Institution = {
      ...insertInstitution,
      id,
      createdAt: new Date(),
    };
    this.institutions.set(id, institution);
    return institution;
  }

  async updateInstitution(id: string, institutionUpdate: Partial<InsertInstitution>): Promise<Institution | undefined> {
    const institution = this.institutions.get(id);
    if (!institution) return undefined;
    
    const updatedInstitution = { ...institution, ...institutionUpdate };
    this.institutions.set(id, updatedInstitution);
    return updatedInstitution;
  }

  // Group methods
  async getGroupsByInstitution(institutionId: string): Promise<Group[]> {
    return Array.from(this.groups.values()).filter(
      group => group.institutionId === institutionId && group.isActive
    );
  }

  async getGroupById(id: string): Promise<Group | undefined> {
    return this.groups.get(id);
  }

  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const id = randomUUID();
    const group: Group = {
      ...insertGroup,
      id,
      createdAt: new Date(),
    };
    this.groups.set(id, group);
    return group;
  }

  async updateGroup(id: string, groupUpdate: Partial<InsertGroup>): Promise<Group | undefined> {
    const group = this.groups.get(id);
    if (!group) return undefined;
    
    const updatedGroup = { ...group, ...groupUpdate };
    this.groups.set(id, updatedGroup);
    return updatedGroup;
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUsersByInstitution(institutionId: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      user => user.institutionId === institutionId && user.isActive
    );
  }

  async getUsersByGroup(groupId: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      user => user.groupId === groupId && user.isActive
    );
  }

  async generateStudentId(institutionCode: string, groupName: string): Promise<string> {
    const key = `${institutionCode}_${groupName}`;
    const currentCount = this.studentIdCounters.get(key) || 0;
    const newCount = currentCount + 1;
    this.studentIdCounters.set(key, newCount);
    
    return `${institutionCode}_${groupName}_${newCount.toString().padStart(3, '0')}`;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    let studentId = undefined;

    // Auto-generate student ID for students
    if (insertUser.role === 'student' && insertUser.institutionId && insertUser.groupId) {
      const institution = await this.getInstitutionById(insertUser.institutionId);
      const group = await this.getGroupById(insertUser.groupId);
      
      if (institution && group) {
        studentId = await this.generateStudentId(institution.code, group.name);
      }
    }

    const user: User = { 
      ...insertUser, 
      id,
      studentId,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, userUpdate: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userUpdate };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Court methods
  async getCourts(institutionId?: string): Promise<Court[]> {
    const courts = Array.from(this.courts.values()).filter(court => court.isActive);
    if (institutionId) {
      return courts.filter(court => court.institutionId === institutionId);
    }
    return courts;
  }

  async getCourtById(id: string): Promise<Court | undefined> {
    return this.courts.get(id);
  }

  async getCourtsByInstitution(institutionId: string): Promise<Court[]> {
    return Array.from(this.courts.values()).filter(
      court => court.institutionId === institutionId && court.isActive
    );
  }

  async createCourt(insertCourt: InsertCourt): Promise<Court> {
    const id = randomUUID();
    const court: Court = {
      ...insertCourt,
      id,
      createdAt: new Date(),
    };
    this.courts.set(id, court);
    return court;
  }

  async updateCourt(id: string, courtUpdate: Partial<InsertCourt>): Promise<Court | undefined> {
    const court = this.courts.get(id);
    if (!court) return undefined;
    
    const updatedCourt = { ...court, ...courtUpdate };
    this.courts.set(id, updatedCourt);
    return updatedCourt;
  }

  async deleteCourt(id: string): Promise<boolean> {
    return this.courts.delete(id);
  }

  // Time slot methods
  async getTimeSlotsByCourtAndDate(courtId: string, date: string): Promise<TimeSlot[]> {
    return Array.from(this.timeSlots.values()).filter(
      slot => slot.courtId === courtId && slot.date === date && slot.isActive
    );
  }

  async getTimeSlotById(id: string): Promise<TimeSlot | undefined> {
    return this.timeSlots.get(id);
  }

  async getAvailableTimeSlots(institutionId: string, userId: string, date: string): Promise<TimeSlot[]> {
    const user = await this.getUser(userId);
    if (!user) return [];

    const availableSlots = Array.from(this.timeSlots.values()).filter(slot => {
      // Basic filters
      if (!slot.isActive || slot.institutionId !== institutionId || slot.date !== date) {
        return false;
      }

      // Check if slot is full
      if (slot.currentBookings >= slot.maxPlayers) {
        return false;
      }

      // Check group restrictions for students
      if (user.role === 'student' && slot.allowedGroups && slot.allowedGroups.length > 0) {
        if (!user.groupId || !slot.allowedGroups.includes(user.groupId)) {
          return false;
        }
      }

      return true;
    });

    return availableSlots;
  }

  async createTimeSlot(insertTimeSlot: InsertTimeSlot): Promise<TimeSlot> {
    const id = randomUUID();
    const timeSlot: TimeSlot = {
      ...insertTimeSlot,
      id,
      createdAt: new Date(),
    };
    this.timeSlots.set(id, timeSlot);
    return timeSlot;
  }

  async updateTimeSlot(id: string, timeSlotUpdate: Partial<InsertTimeSlot>): Promise<TimeSlot | undefined> {
    const timeSlot = this.timeSlots.get(id);
    if (!timeSlot) return undefined;
    
    const updatedTimeSlot = { ...timeSlot, ...timeSlotUpdate };
    this.timeSlots.set(id, updatedTimeSlot);
    return updatedTimeSlot;
  }

  async deleteTimeSlot(id: string): Promise<boolean> {
    return this.timeSlots.delete(id);
  }

  // Booking methods
  async getBookingsByUser(userId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      booking => booking.userId === userId
    ).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async getBookingById(id: string): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getBookingsByDate(date: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      booking => booking.date === date
    );
  }

  async getBookingsByCourtAndDate(courtId: string, date: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      booking => booking.courtId === courtId && booking.date === date && booking.status === 'confirmed'
    );
  }

  async getUserBookingsForDate(userId: string, date: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      booking => booking.userId === userId && booking.date === date && booking.status === 'confirmed'
    );
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = randomUUID();
    const booking: Booking = {
      ...insertBooking,
      id,
      createdAt: new Date(),
    };
    
    // Update time slot current bookings count
    const timeSlot = await this.getTimeSlotById(booking.timeSlotId);
    if (timeSlot) {
      await this.updateTimeSlot(timeSlot.id, {
        currentBookings: timeSlot.currentBookings + (insertBooking.playersCount || 1)
      });
    }
    
    this.bookings.set(id, booking);
    return booking;
  }

  async updateBooking(id: string, bookingUpdate: Partial<InsertBooking>): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    
    // If cancelling a booking, update time slot availability
    if (bookingUpdate.status === 'cancelled' && booking.status === 'confirmed') {
      const timeSlot = await this.getTimeSlotById(booking.timeSlotId);
      if (timeSlot) {
        await this.updateTimeSlot(timeSlot.id, {
          currentBookings: Math.max(0, timeSlot.currentBookings - booking.playersCount)
        });
      }
    }
    
    const updatedBooking = { ...booking, ...bookingUpdate };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }

  async getSportsTrackingByUser(userId: string): Promise<SportsTracking[]> {
    return Array.from(this.sportsTracking.values()).filter(
      tracking => tracking.userId === userId
    ).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async createSportsTracking(insertTracking: InsertSportsTracking): Promise<SportsTracking> {
    const id = randomUUID();
    const tracking: SportsTracking = {
      ...insertTracking,
      id,
      createdAt: new Date(),
    };
    this.sportsTracking.set(id, tracking);
    return tracking;
  }
}

export const storage = new MemStorage();
