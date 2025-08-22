import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get session for admin authentication
    const session = await getAuth().api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add admin role check here
    // For now, we'll allow any authenticated user to approve/reject
    // In production, you should check if the user has admin privileges

    const { action } = await request.json();

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    const userId = (await params).id;
    const approvalStatus = action === "approve" ? "APPROVED" : "REJECTED";

    // Update user approval status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        approvalStatus,
        emailVerified: action === "approve" ? true : false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        approvalStatus: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `User ${
        action === "approve" ? "approved" : "rejected"
      } successfully`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user approval status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get session for admin authentication
    const session = await getAuth().api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (await params).id;

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        approvalStatus: true,
        emailVerified: true,
        kycStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
