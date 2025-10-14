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
    const documentFront = formData.get("documentFront") as File;
    const documentBack = formData.get("documentBack") as File;
    const documentSelfie = formData.get("documentSelfie") as File;

    if (!documentFront || !documentBack || !documentSelfie) {
      return NextResponse.json(
        { error: "All KYC documents are required" },
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

    // Generate unique filenames
    const timestamp = Date.now();
    const frontFilename = `front_${timestamp}.${documentFront.name
      .split(".")
      .pop()}`;
    const backFilename = `back_${timestamp}.${documentBack.name
      .split(".")
      .pop()}`;
    const selfieFilename = `selfie_${timestamp}.${documentSelfie.name
      .split(".")
      .pop()}`;

    // Convert files to buffers and save them
    const frontBuffer = Buffer.from(await documentFront.arrayBuffer());
    const backBuffer = Buffer.from(await documentBack.arrayBuffer());
    const selfieBuffer = Buffer.from(await documentSelfie.arrayBuffer());

    const frontPath = join(uploadDir, frontFilename);
    const backPath = join(uploadDir, backFilename);
    const selfiePath = join(uploadDir, selfieFilename);

    await writeFile(frontPath, frontBuffer);
    await writeFile(backPath, backBuffer);
    await writeFile(selfiePath, selfieBuffer);

    // Generate relative paths for database storage
    const frontRelativePath = `/uploads/kyc/user_${user.id}/${frontFilename}`;
    const backRelativePath = `/uploads/kyc/user_${user.id}/${backFilename}`;
    const selfieRelativePath = `/uploads/kyc/user_${user.id}/${selfieFilename}`;

    // Update user with KYC document paths and status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        documentFront: frontRelativePath,
        documentBack: backRelativePath,
        documentSelfie: selfieRelativePath,
        kycStatus: "PENDING",
        kycSubmittedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "KYC documents submitted successfully",
      documents: {
        front: frontRelativePath,
        back: backRelativePath,
        selfie: selfieRelativePath,
      },
    });
  } catch (error) {
    console.error("Error submitting KYC documents:", error);
    return NextResponse.json(
      { error: "Failed to submit KYC documents" },
      { status: 500 }
    );
  }
}
