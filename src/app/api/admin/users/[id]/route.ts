import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// PATCH - Update user (change role)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { role } = body;

    if (!role || (role !== "ADMIN" && role !== "CLIENT")) {
      return NextResponse.json(
        { success: false, error: "Role must be ADMIN or CLIENT" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        role,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role}`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    );
  }
}
