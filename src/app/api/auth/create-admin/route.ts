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
    const existingAdmin = await prisma.user.findUnique({
      where: { id: "admin_001" },
    });

    if (existingAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin user already exists",
          admin: {
            id: existingAdmin.id,
            email: existingAdmin.email,
            name: existingAdmin.name,
          },
        },
        { status: 200 }
      );
    }

    // Create admin user with default credentials
    const adminEmail = "admin@bsmarket.com.br";
    const adminPassword = "admin123";
    const hashedPassword = await hash(adminPassword, 12);

    const adminUser = await prisma.user.create({
      data: {
        id: "admin_001",
        name: "BS Market Admin",
        email: adminEmail.toLowerCase(),
        password: hashedPassword,
        emailVerified: true,
        phoneVerified: true,
        approvalStatus: "APPROVED",
        kycStatus: "APPROVED",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create initial balance for admin
    await prisma.balance.create({
      data: {
        userId: adminUser.id,
        currency: "BRL",
        amount: 0,
        locked: 0,
      },
    });

    console.log("Admin user created successfully:", {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
    });

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully",
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        defaultPassword: adminPassword, // Only shown on creation
      },
      instructions:
        "Please login with these credentials at /admin/login and change the password immediately",
    });
  } catch (error) {
    console.error("Admin creation error:", error);
    return NextResponse.json(
      {
        error: "Failed to create admin user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}



