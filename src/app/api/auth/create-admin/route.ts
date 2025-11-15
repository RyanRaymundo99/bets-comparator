import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    // Only allow this endpoint on localhost for security
    const host = request.headers.get("host") || "";
    if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
      return NextResponse.json(
        { error: "This endpoint is only available on localhost" },
        { status: 403 }
      );
    }

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (existingAdmin) {
      return NextResponse.json(
        {
          success: true,
          message: "Admin user already exists",
          admin: {
            id: existingAdmin.id,
            email: existingAdmin.email,
            name: existingAdmin.name,
            role: existingAdmin.role,
          },
          instructions: "Use this email and password to login at /admin/login",
        },
        { status: 200 }
      );
    }

    // Create admin user with default credentials
    const adminEmail = "admin@betscomparator.com";
    const adminPassword = "admin123456"; // 8+ characters
    const hashedPassword = await hash(adminPassword, 12);

    const adminUser = await prisma.user.create({
      data: {
        id: `admin_${Date.now()}`,
        name: "Admin Bets Comparator",
        email: adminEmail.toLowerCase(),
        password: hashedPassword,
        emailVerified: true,
        role: "ADMIN", // Set as ADMIN
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log("Admin user created successfully:", {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
    });

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully! 🎉",
      credentials: {
        email: adminEmail,
        password: adminPassword, // Only shown on creation
      },
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
      },
      instructions: [
        "1. Go to http://localhost:3000/admin/login",
        `2. Login with email: ${adminEmail}`,
        `3. Login with password: ${adminPassword}`,
        "4. IMPORTANT: Change your password after first login!",
      ],
    });
  } catch (error) {
    console.error("Admin creation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create admin user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Also support GET requests for easier access
export async function GET(request: NextRequest) {
  return POST(request);
}
