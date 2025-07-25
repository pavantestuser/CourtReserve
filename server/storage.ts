import { 
  type User, 
  type InsertUser, 
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
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getCourts(): Promise<Court[]>;
  getCourtById(id: string): Promise<Court | undefined>;
  createCourt(court: InsertCourt): Promise<Court>;
  updateCourt(id: string, court: Partial<InsertCourt>): Promise<Court | undefined>;
  deleteCourt(id: string): Promise<boolean>;
  
  getTimeSlotsByCourtAndDate(courtId: string, date: string): Promise<TimeSlot[]>;
  getTimeSlotById(id: string): Promise<TimeSlot | undefined>;
  createTimeSlot(timeSlot: InsertTimeSlot): Promise<TimeSlot>;
  updateTimeSlot(id: string, timeSlot: Partial<InsertTimeSlot>): Promise<TimeSlot | undefined>;
  deleteTimeSlot(id: string): Promise<boolean>;
  
  getBookingsByUser(userId: string): Promise<Booking[]>;
  getBookingById(id: string): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking | undefined>;
  getBookingsByDate(date: string): Promise<Booking[]>;
  getBookingsByCourtAndDate(courtId: string, date: string): Promise<Booking[]>;
  
  getSportsTrackingByUser(userId: string): Promise<SportsTracking[]>;
  createSportsTracking(tracking: InsertSportsTracking): Promise<SportsTracking>;
  
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private courts: Map<string, Court>;
  private timeSlots: Map<string, TimeSlot>;
  private bookings: Map<string, Booking>;
  private sportsTracking: Map<string, SportsTracking>;
  public sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.courts = new Map();
    this.timeSlots = new Map();
    this.bookings = new Map();
    this.sportsTracking = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Initialize with some default courts
    this.initializeDefaultCourts();
  }

  private async initializeDefaultCourts() {
    const defaultCourts: InsertCourt[] = [
      {
        name: "Tennis Court A",
        type: "tennis",
        location: "Sports Complex - Level 1",
        description: "Professional tennis court with synthetic surface",
        hourlyRate: "25.00",
        capacity: 4,
        isActive: true,
      },
      {
        name: "Basketball Court 1",
        type: "basketball",
        location: "Main Gymnasium",
        description: "Indoor basketball court with wooden flooring",
        hourlyRate: "30.00",
        capacity: 10,
        isActive: true,
      },
      {
        name: "Football Field A",
        type: "football",
        location: "Outdoor Sports Area",
        description: "Regulation size football field with natural grass",
        hourlyRate: "50.00",
        capacity: 22,
        isActive: true,
      },
    ];

    for (const court of defaultCourts) {
      await this.createCourt(court);
    }
  }

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

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getCourts(): Promise<Court[]> {
    return Array.from(this.courts.values()).filter(court => court.isActive);
  }

  async getCourtById(id: string): Promise<Court | undefined> {
    return this.courts.get(id);
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

  async getTimeSlotsByCourtAndDate(courtId: string, date: string): Promise<TimeSlot[]> {
    return Array.from(this.timeSlots.values()).filter(
      slot => slot.courtId === courtId && slot.date === date
    );
  }

  async getTimeSlotById(id: string): Promise<TimeSlot | undefined> {
    return this.timeSlots.get(id);
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

  async getBookingsByUser(userId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      booking => booking.userId === userId
    ).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async getBookingById(id: string): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = randomUUID();
    const booking: Booking = {
      ...insertBooking,
      id,
      createdAt: new Date(),
    };
    this.bookings.set(id, booking);
    return booking;
  }

  async updateBooking(id: string, bookingUpdate: Partial<InsertBooking>): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    
    const updatedBooking = { ...booking, ...bookingUpdate };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }

  async getBookingsByDate(date: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      booking => booking.date === date
    );
  }

  async getBookingsByCourtAndDate(courtId: string, date: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      booking => booking.courtId === courtId && booking.date === date
    );
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
