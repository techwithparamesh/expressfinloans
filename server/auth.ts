import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import type { Request } from "express";
import { storage } from "./storage";
import { verifyPassword } from "./lib/password";
import type { User } from "@shared/schema";

export type StaffUser = Pick<User, "id" | "username" | "role" | "fullName" | "email" | "phone">;

export function configurePassport() {
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) return done(null, false, { message: "Invalid username or password" });
        if (!verifyPassword(password, user.password)) return done(null, false, { message: "Invalid username or password" });
        return done(null, toStaffUser(user));
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: StaffUser, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) return done(null, null);
      return done(null, toStaffUser(user));
    } catch (err) {
      done(err);
    }
  });
}

function toStaffUser(u: User): StaffUser {
  return {
    id: u.id,
    username: u.username,
    role: u.role as "admin" | "employee",
    fullName: u.fullName ?? undefined,
    email: u.email ?? undefined,
    phone: u.phone ?? undefined,
  };
}

export function isAuthenticated(req: Request): boolean {
  return !!req.user;
}

export function isAdmin(req: Request): boolean {
  return !!req.user && (req.user as StaffUser).role === "admin";
}

export function requireAuth(req: Request, res: import("express").Response, next: import("express").NextFunction) {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: import("express").Response, next: import("express").NextFunction) {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  if ((req.user as StaffUser).role !== "admin") {
    res.status(403).json({ message: "Forbidden" });
    return;
  }
  next();
}

declare global {
  namespace Express {
    interface User extends StaffUser {}
  }
}
