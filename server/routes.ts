import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { 
  insertInstitutionSchema,
  insertGroupSchema,
  insertUserSchema,
  insertCourtSchema, 
  insertTimeSlotSchema, 
  insertBookingSchema,
  insertSportsTrackingSchema 
} from "@shared/schema";
import { z } from "zod";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Institution management endpoints (Super Admin only)
  app.get("/api/institutions", async (req, res) => {
    if (!req.user || req.user.role !== "super_admin") {
      return res.status(403).json({ error: "Super admin access required" });
    }

    try {
      const institutions = await storage.getInstitutions();
      res.json(institutions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch institutions" });
    }
  });

  app.post("/api/institutions", async (req, res) => {
    if (!req.user || req.user.role !== "super_admin") {
      return res.status(403).json({ error: "Super admin access required" });
    }

    try {
      const institutionData = insertInstitutionSchema.parse(req.body);
      const institution = await storage.createInstitution(institutionData);
      res.status(201).json(institution);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create institution" });
    }
  });

  // Group management endpoints (Staff only)
  app.get("/api/groups", async (req, res) => {
    if (!req.user || !req.user.institutionId) {
      return res.status(403).json({ error: "Institution access required" });
    }

    try {
      const groups = await storage.getGroupsByInstitution(req.user.institutionId);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch groups" });
    }
  });

  app.post("/api/groups", async (req, res) => {
    if (!req.user || req.user.role !== "staff" || !req.user.institutionId) {
      return res.status(403).json({ error: "Staff access required" });
    }

    try {
      const groupData = insertGroupSchema.parse({
        ...req.body,
        institutionId: req.user.institutionId
      });
      const group = await storage.createGroup(groupData);
      res.status(201).json(group);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create group" });
    }
  });

  // Enhanced user management
  app.get("/api/users", async (req, res) => {
    if (!req.user || (req.user.role !== "staff" && req.user.role !== "super_admin")) {
      return res.status(403).json({ error: "Staff or super admin access required" });
    }

    try {
      let users: any[] = [];
      if (req.user.role === "super_admin") {
        // Super admin can see all users
        const { institutionId } = req.query;
        if (institutionId && typeof institutionId === "string") {
          users = await storage.getUsersByInstitution(institutionId);
        }
      } else if (req.user.institutionId) {
        // Staff can only see users from their institution
        users = await storage.getUsersByInstitution(req.user.institutionId);
      }
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    if (!req.user || req.user.role !== "staff" || !req.user.institutionId) {
      return res.status(403).json({ error: "Staff access required" });
    }

    try {
      const userData = insertUserSchema.parse({
        ...req.body,
        institutionId: req.user.institutionId
      });
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Enhanced courts endpoints
  app.get("/api/courts", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      let courts: any[] = [];
      if (req.user.role === "super_admin") {
        const { institutionId } = req.query;
        courts = await storage.getCourts(institutionId as string);
      } else if (req.user.institutionId) {
        courts = await storage.getCourtsByInstitution(req.user.institutionId);
      }
      res.json(courts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch courts" });
    }
  });

  app.get("/api/courts/:id", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const court = await storage.getCourtById(req.params.id);
      if (!court) {
        return res.status(404).json({ error: "Court not found" });
      }

      // Check if user has access to this court's institution
      if (req.user.role !== "super_admin" && court.institutionId !== req.user.institutionId) {
        return res.status(403).json({ error: "Access denied to this court" });
      }

      res.json(court);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch court" });
    }
  });

  app.post("/api/courts", async (req, res) => {
    if (!req.user || req.user.role !== "staff" || !req.user.institutionId) {
      return res.status(403).json({ error: "Staff access required" });
    }

    try {
      const courtData = insertCourtSchema.parse({
        ...req.body,
        institutionId: req.user.institutionId
      });
      const court = await storage.createCourt(courtData);
      res.status(201).json(court);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create court" });
    }
  });

  app.put("/api/courts/:id", async (req, res) => {
    if (!req.user || req.user.role !== "staff") {
      return res.status(403).json({ error: "Staff access required" });
    }

    try {
      const court = await storage.getCourtById(req.params.id);
      if (!court || court.institutionId !== req.user.institutionId) {
        return res.status(404).json({ error: "Court not found or access denied" });
      }

      const courtData = insertCourtSchema.partial().parse(req.body);
      const updatedCourt = await storage.updateCourt(req.params.id, courtData);
      res.json(updatedCourt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update court" });
    }
  });

  // Time slots endpoints
  app.get("/api/courts/:courtId/timeslots", async (req, res) => {
    try {
      const { date } = req.query;
      if (!date || typeof date !== "string") {
        return res.status(400).json({ error: "Date parameter is required" });
      }
      
      const timeSlots = await storage.getTimeSlotsByCourtAndDate(req.params.courtId, date);
      const bookings = await storage.getBookingsByCourtAndDate(req.params.courtId, date);
      
      // Mark slots as unavailable if they're booked
      const bookedTimeSlots = new Set(bookings.map(b => b.timeSlotId));
      const slotsWithAvailability = timeSlots.map(slot => ({
        ...slot,
        isAvailable: slot.isActive && slot.currentBookings < slot.maxPlayers && !bookedTimeSlots.has(slot.id)
      }));
      
      res.json(slotsWithAvailability);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch time slots" });
    }
  });

  // Enhanced time slots with availability filtering
  app.get("/api/timeslots/available", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { date } = req.query;
      if (!date || typeof date !== "string") {
        return res.status(400).json({ error: "Date parameter is required" });
      }

      const institutionId = req.user.institutionId;
      if (!institutionId) {
        return res.status(403).json({ error: "Institution access required" });
      }

      const availableSlots = await storage.getAvailableTimeSlots(institutionId, req.user.id, date);
      res.json(availableSlots);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch available time slots" });
    }
  });

  app.post("/api/courts/:courtId/timeslots", async (req, res) => {
    if (!req.user || req.user.role !== "staff" || !req.user.institutionId) {
      return res.status(403).json({ error: "Staff access required" });
    }

    try {
      // Verify court belongs to user's institution
      const court = await storage.getCourtById(req.params.courtId);
      if (!court || court.institutionId !== req.user.institutionId) {
        return res.status(403).json({ error: "Access denied to this court" });
      }

      const timeSlotData = insertTimeSlotSchema.parse({
        ...req.body,
        courtId: req.params.courtId,
        institutionId: req.user.institutionId,
        maxPlayers: req.body.maxPlayers || court.capacity
      });
      
      const timeSlot = await storage.createTimeSlot(timeSlotData);
      res.status(201).json(timeSlot);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create time slot" });
    }
  });

  // Bookings endpoints
  app.get("/api/bookings", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const bookings = await storage.getBookingsByUser(req.user.id);
      
      // Enrich bookings with court information
      const enrichedBookings = await Promise.all(
        bookings.map(async (booking) => {
          const court = await storage.getCourtById(booking.courtId);
          return {
            ...booking,
            court
          };
        })
      );
      
      res.json(enrichedBookings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        userId: req.user.id
      });

      // Check if time slot is available
      const timeSlot = await storage.getTimeSlotById(bookingData.timeSlotId);
      if (!timeSlot || !timeSlot.isActive || timeSlot.currentBookings >= timeSlot.maxPlayers) {
        return res.status(400).json({ error: "Time slot is not available" });
      }

      // Check group restrictions for students
      if (req.user.role === 'student' && timeSlot.allowedGroups && timeSlot.allowedGroups.length > 0) {
        if (!req.user.groupId || !timeSlot.allowedGroups.includes(req.user.groupId)) {
          return res.status(403).json({ error: "You are not allowed to book this time slot" });
        }
      }

      // Check one-slot-per-day restriction
      if (timeSlot.oneSlotPerDay) {
        const userBookingsToday = await storage.getUserBookingsForDate(req.user.id, bookingData.date);
        if (userBookingsToday.length > 0) {
          return res.status(400).json({ error: "You can only book one slot per day for this type" });
        }
      }

      // Ensure institution context matches
      if (!req.user.institutionId || timeSlot.institutionId !== req.user.institutionId) {
        return res.status(403).json({ error: "Access denied to this time slot" });
      }

      const booking = await storage.createBooking(bookingData);
      
      // Create sports tracking entry
      const court = await storage.getCourtById(booking.courtId);
      if (court) {
        const startTime = new Date(`${booking.date}T${booking.startTime}`);
        const endTime = new Date(`${booking.date}T${booking.endTime}`);
        const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
        
        await storage.createSportsTracking({
          userId: req.user.id,
          institutionId: court.institutionId,
          sportType: court.sportType,
          courtId: court.id,
          date: booking.date,
          duration,
          playersCount: bookingData.playersCount || 1
        });
      }

      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create booking" });
    }
  });

  app.put("/api/bookings/:id", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const booking = await storage.getBookingById(req.params.id);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      // Users can only update their own bookings, staff can update any in their institution
      if (req.user.role === "student" || req.user.role === "public_user") {
        if (booking.userId !== req.user.id) {
          return res.status(403).json({ error: "Access denied" });
        }
      } else if (req.user.role === "staff") {
        if (booking.institutionId !== req.user.institutionId) {
          return res.status(403).json({ error: "Access denied to bookings outside your institution" });
        }
      }

      const bookingData = insertBookingSchema.partial().parse(req.body);
      const updatedBooking = await storage.updateBooking(req.params.id, bookingData);
      
      res.json(updatedBooking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update booking" });
    }
  });

  // Sports tracking endpoints
  app.get("/api/sports-tracking", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const tracking = await storage.getSportsTrackingByUser(req.user.id);
      res.json(tracking);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sports tracking data" });
    }
  });

  // Enhanced analytics endpoints
  app.get("/api/admin/analytics", async (req, res) => {
    if (!req.user || (req.user.role !== "staff" && req.user.role !== "super_admin")) {
      return res.status(403).json({ error: "Staff or super admin access required" });
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      let courts: any[] = [];
      let todayBookings: any[] = [];

      if (req.user.role === "super_admin") {
        const { institutionId } = req.query;
        if (institutionId && typeof institutionId === "string") {
          courts = await storage.getCourtsByInstitution(institutionId);
          todayBookings = (await storage.getBookingsByDate(today)).filter(
            b => courts.some(c => c.id === b.courtId)
          );
        }
      } else if (req.user.institutionId) {
        courts = await storage.getCourtsByInstitution(req.user.institutionId);
        todayBookings = (await storage.getBookingsByDate(today)).filter(
          b => courts.some(c => c.id === b.courtId)
        );
      }
      
      const analytics = {
        totalBookingsToday: todayBookings.length,
        totalCourts: courts.length,
        activeCourts: courts.filter(c => c.isActive).length,
        utilizationRate: courts.length > 0 ? Math.round((todayBookings.length / (courts.length * 12)) * 100) : 0,
        courtStats: courts.map(court => {
          const courtBookings = todayBookings.filter(b => b.courtId === court.id);
          return {
            ...court,
            todayBookings: courtBookings.length,
            utilization: Math.round((courtBookings.length / 12) * 100)
          };
        })
      };

      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Enhanced booking validation endpoint
  app.post("/api/bookings/validate", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { timeSlotId, date, playersCount } = req.body;
      
      const timeSlot = await storage.getTimeSlotById(timeSlotId);
      if (!timeSlot) {
        return res.json({ valid: false, reason: "Time slot not found" });
      }

      // Check basic availability
      if (!timeSlot.isActive || (timeSlot.currentBookings + (playersCount || 1)) > timeSlot.maxPlayers) {
        return res.json({ valid: false, reason: "Time slot is full" });
      }

      // Check group restrictions
      if (req.user.role === 'student' && timeSlot.allowedGroups && timeSlot.allowedGroups.length > 0) {
        if (!req.user.groupId || !timeSlot.allowedGroups.includes(req.user.groupId)) {
          return res.json({ valid: false, reason: "Group restriction: You are not allowed to book this slot" });
        }
      }

      // Check one-slot-per-day restriction
      if (timeSlot.oneSlotPerDay) {
        const userBookingsToday = await storage.getUserBookingsForDate(req.user.id, date);
        if (userBookingsToday.length > 0) {
          return res.json({ valid: false, reason: "You can only book one slot per day for this sport" });
        }
      }

      // Check institution access
      if (!req.user.institutionId || timeSlot.institutionId !== req.user.institutionId) {
        return res.json({ valid: false, reason: "Access denied to this institution's facilities" });
      }

      res.json({ 
        valid: true, 
        availableCapacity: timeSlot.maxPlayers - timeSlot.currentBookings 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to validate booking" });
    }
  });

  // Development endpoint to create default admin user
  app.post("/api/setup/admin", async (req, res) => {
    try {
      const institutions = await storage.getInstitutions();
      if (institutions.length === 0) {
        return res.status(400).json({ error: "No institutions found" });
      }

      const defaultInstitution = institutions[0];
      
      // Check if admin already exists
      const existingAdmin = await storage.getUserByUsername("admin");
      if (existingAdmin) {
        return res.json({ message: "Admin user already exists", user: existingAdmin });
      }

      // Import hashing functions from auth module
      const { scrypt, randomBytes } = await import("crypto");
      const { promisify } = await import("util");
      const scryptAsync = promisify(scrypt);

      const password = "admin123";
      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync(password, salt, 64)) as Buffer;
      const hashedPassword = `${buf.toString("hex")}.${salt}`;

      const adminUser = await storage.createUser({
        username: "admin",
        password: hashedPassword,
        email: "admin@samplecollege.edu",
        fullName: "System Administrator",
        role: "staff",
        institutionId: defaultInstitution.id,
        isActive: true,
      });

      res.json({ message: "Admin user created successfully", user: adminUser });
    } catch (error) {
      console.error("Error creating admin user:", error);
      res.status(500).json({ error: "Failed to create admin user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
