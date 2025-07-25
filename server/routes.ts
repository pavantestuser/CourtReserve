import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertCourtSchema, insertTimeSlotSchema, insertBookingSchema } from "@shared/schema";
import { z } from "zod";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Courts endpoints
  app.get("/api/courts", async (req, res) => {
    try {
      const courts = await storage.getCourts();
      res.json(courts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch courts" });
    }
  });

  app.get("/api/courts/:id", async (req, res) => {
    try {
      const court = await storage.getCourtById(req.params.id);
      if (!court) {
        return res.status(404).json({ error: "Court not found" });
      }
      res.json(court);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch court" });
    }
  });

  app.post("/api/courts", async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const courtData = insertCourtSchema.parse(req.body);
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
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const courtData = insertCourtSchema.partial().parse(req.body);
      const court = await storage.updateCourt(req.params.id, courtData);
      if (!court) {
        return res.status(404).json({ error: "Court not found" });
      }
      res.json(court);
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
        isAvailable: slot.isAvailable && !bookedTimeSlots.has(slot.id)
      }));
      
      res.json(slotsWithAvailability);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch time slots" });
    }
  });

  app.post("/api/courts/:courtId/timeslots", async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const timeSlotData = insertTimeSlotSchema.parse({
        ...req.body,
        courtId: req.params.courtId
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
      if (!timeSlot || !timeSlot.isAvailable) {
        return res.status(400).json({ error: "Time slot is not available" });
      }

      // Check for conflicting bookings
      const existingBookings = await storage.getBookingsByCourtAndDate(
        bookingData.courtId,
        bookingData.date
      );
      
      const hasConflict = existingBookings.some(booking => 
        booking.timeSlotId === bookingData.timeSlotId && 
        booking.status === "confirmed"
      );

      if (hasConflict) {
        return res.status(400).json({ error: "Time slot is already booked" });
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
          courtType: court.type,
          date: booking.date,
          duration
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

      // Users can only update their own bookings, admins can update any
      if (req.user.role !== "admin" && booking.userId !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
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

  // Admin analytics endpoints
  app.get("/api/admin/analytics", async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const todayBookings = await storage.getBookingsByDate(today);
      const courts = await storage.getCourts();
      
      const analytics = {
        totalBookingsToday: todayBookings.length,
        totalCourts: courts.length,
        activeCourts: courts.filter(c => c.isActive).length,
        utilizationRate: courts.length > 0 ? Math.round((todayBookings.length / (courts.length * 12)) * 100) : 0, // Assuming 12 slots per day per court
        courtStats: courts.map(court => {
          const courtBookings = todayBookings.filter(b => b.courtId === court.id);
          return {
            ...court,
            todayBookings: courtBookings.length,
            utilization: Math.round((courtBookings.length / 12) * 100) // Assuming 12 slots per day
          };
        })
      };

      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
