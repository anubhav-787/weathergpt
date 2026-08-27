import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma"; // adjust relative path to match your project structure

export async function POST(req) {
  try {
    const { clerkId, latitude, longitude, fcmToken } = await req.json();

    if (!clerkId) {
      return NextResponse.json({ error: "clerkId is required" }, { status: 400 });
    }
    if (latitude == null || longitude == null) {
      return NextResponse.json({ error: "latitude and longitude are required" }, { status: 400 });
    }

    // Upsert on clerkId: creates a new row the first time, updates the same
    // row (location/token) on every later call instead of duplicating.
    const record = await prisma.userAlert.upsert({
      where: { clerkId },
      update: {
        latitude,
        longitude,
        ...(fcmToken ? { fcmToken } : {}),
      },
      create: {
        clerkId,
        latitude,
        longitude,
        fcmToken: fcmToken || null,
      },
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error("User location upsert error:", error);
    return NextResponse.json({ error: "Failed to save location" }, { status: 500 });
  }
}