import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-helpers";
import {
  successResponse,
  unauthorizedResponse,
  badRequestResponse,
  notFoundResponse,
  withErrorHandling,
} from "@/lib/api-response";

// POST /api/admin/bets/[id]/upload - Upload logo or cover image
export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await getSession(request);

  console.log("Upload API - Session check:", {
    hasSession: !!session,
    role: session?.user?.role,
    userId: session?.userId,
  });

  if (!session) {
    console.log("Upload API - No session found");
    return unauthorizedResponse("Admin access required - No session");
  }

  if (session.user.role !== "ADMIN") {
    console.log("Upload API - User is not admin:", session.user.role);
    return unauthorizedResponse("Admin access required - Not admin");
  }

  const { id } = await params;
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string | null; // "logo" or "cover"

  if (!file) {
    return badRequestResponse("File is required");
  }

  if (!type || (type !== "logo" && type !== "cover")) {
    return badRequestResponse("Type must be 'logo' or 'cover'");
  }

  // Verify bet exists
  const bet = await prisma.bet.findUnique({
    where: { id },
  });

  if (!bet) {
    return notFoundResponse("Bet not found");
  }

  try {
    // Validate file type - accept all image types
    if (!file.type.startsWith("image/")) {
      return badRequestResponse("Invalid file type. Only image files are allowed");
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return badRequestResponse("File size exceeds 5MB limit");
    }

    // Create uploads directory structure
    const uploadsDir = join(process.cwd(), "public", "uploads", "bets", id);
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split(".").pop() || "jpg";
    const filename = `${type}_${timestamp}.${extension}`;
    const filepath = join(uploadsDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Create public URL path
    const publicPath = `/uploads/bets/${id}/${filename}`;

    // Update bet with image path
    const updateData = type === "logo" 
      ? { logo: publicPath }
      : { coverImage: publicPath };

    const updatedBet = await prisma.bet.update({
      where: { id },
      data: updateData,
    });

    return successResponse({
      message: `${type === "logo" ? "Logo" : "Cover"} uploaded successfully`,
      path: publicPath,
      bet: updatedBet,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload file" },
      { status: 500 }
    );
  }
});

// DELETE /api/admin/bets/[id]/upload - Delete logo or cover image
export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await getSession(request);

  if (!session || session.user.role !== "ADMIN") {
    return unauthorizedResponse("Admin access required");
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // "logo" or "cover"

  if (!type || (type !== "logo" && type !== "cover")) {
    return badRequestResponse("Type must be 'logo' or 'cover'");
  }

  // Verify bet exists
  const bet = await prisma.bet.findUnique({
    where: { id },
  });

  if (!bet) {
    return notFoundResponse("Bet not found");
  }

  try {
    // Update bet to remove image path
    const updateData = type === "logo" 
      ? { logo: null }
      : { coverImage: null };

    const updatedBet = await prisma.bet.update({
      where: { id },
      data: updateData,
    });

    // Note: We don't delete the physical file here to avoid issues
    // Files can be cleaned up manually or via a cleanup job

    return successResponse({
      message: `${type === "logo" ? "Logo" : "Cover"} removed successfully`,
      bet: updatedBet,
    });
  } catch (error) {
    console.error("Error removing file:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove file" },
      { status: 500 }
    );
  }
});

