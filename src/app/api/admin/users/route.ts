import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - List all users
export async function GET(request: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { role: "desc" }, // ADMIN first
        { createdAt: "desc" }, // Most recent first
      ],
    });

    return NextResponse.json({
      success: true,
      users,
      total: users.length,
      admins: users.filter((u) => u.role === "ADMIN").length,
      clients: users.filter((u) => u.role === "CLIENT").length,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
