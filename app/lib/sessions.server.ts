import { createCookieSessionStorage, redirect } from "react-router";
import { db } from "./db.server";
import type { User } from "./db.server";
import { execSync } from "child_process";

const sessionSecret = process.env.SESSION_SECRET || "vision_plus_super_secret_key_2026";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__vp_session",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    httpOnly: true,
  },
});

export async function getSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

export async function getUser(request: Request): Promise<User | null> {
  const session = await getSession(request);
  const userId = session.get("userId");
  if (!userId) return null;

  const user = await db.user.findUnique({ where: { id: userId } });
  return user;
}


export async function getAdminUser(request: Request): Promise<User | null> {
  const session = await getSession(request);
  const userId = session.get("userId");
  if (!userId) return null;

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  // Verify role
  if (user.role !== "administrator" && user.role !== "shop_manager") {
    return null;
  }

  return user;
}

export async function requireAdminUser(request: Request): Promise<User> {
  const user = await getAdminUser(request);
  if (!user) {
    throw redirect("/store_backend/login");
  }
  if (user.status === "suspended") {
    throw redirect("/store_backend/login?error=suspended");
  }
  return user;
}

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await sessionStorage.getSession();
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

export async function logout(request: Request) {
  const session = await getSession(request);
  return redirect("/store_backend/login", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}

/**
 * Ensures the dashboard can only be accessed/developed on the "admin-dashboard" branch during local development.
 */
export function checkAdminBranch() {
  if (process.env.NODE_ENV === "development") {
    try {
      const currentBranch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf8" }).trim();
      if (currentBranch !== "admin-dashboard") {
        throw new Error(`Development of the dashboard is restricted to the "admin-dashboard" branch. Current branch is "${currentBranch}".`);
      }
    } catch (e: any) {
      if (e.message && e.message.includes("restricted")) {
        throw new Response(e.message, { 
          status: 403, 
          statusText: "Forbidden Branch"
        });
      }
    }
  }
}
