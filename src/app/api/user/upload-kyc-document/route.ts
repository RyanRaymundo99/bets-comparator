import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    // Get the session cookie
    const sessionCookie = request.cookies.get("better-auth.session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the session in the database
    const session = await prisma.session.findUnique({
      where: { token: sessionCookie.value },
      include: { user: true },
    });

    if (!session || session.expiresAt <= new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const user = session.user;

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file || !type) {
      return NextResponse.json(
        { error: "File and type are required" },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(
      process.cwd(),
      "public",
      "uploads",
      "kyc",
      `user_${user.id}`
    );
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${type}_${timestamp}.${file.name.split(".").pop()}`;
    const filePath = join(uploadDir, filename);

    // Convert file to buffer and save it
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Generate relative path for database storage
    const relativePath = `/uploads/kyc/user_${user.id}/${filename}`;

    // Update user with the new document path
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (type === "front") {
      updateData.documentFront = relativePath;
    } else if (type === "back") {
      updateData.documentBack = relativePath;
    } else if (type === "selfie") {
      updateData.documentSelfie = relativePath;
    }

    // If this is the first KYC submission, update the status
    if (!user.documentFront && !user.documentBack && !user.documentSelfie) {
      updateData.kycStatus = "PENDING";
      updateData.kycSubmittedAt = new Date();
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Document uploaded successfully",
      documentPath: relativePath,
    });
  } catch (error) {
    console.error("Error uploading KYC document:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}
