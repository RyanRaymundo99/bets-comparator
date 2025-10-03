import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const documentType = formData.get("documentType") as string;
    const documentNumber = formData.get("documentNumber") as string;
    const cpf = formData.get("cpf") as string;
    const documentFront = formData.get("documentFront") as File;
    const documentBack = formData.get("documentBack") as File;
    const documentSelfie = formData.get("documentSelfie") as File;

    // Validate required fields
    if (
      !documentType ||
      !documentNumber ||
      !cpf ||
      !documentFront ||
      !documentBack ||
      !documentSelfie
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate document type
    const validDocumentTypes = ["RG", "HABILITACAO", "CNH", "PASSPORT"];
    if (!validDocumentTypes.includes(documentType)) {
      return NextResponse.json(
        { error: "Invalid document type" },
        { status: 400 }
      );
    }

    // Try to get user from session first, then fallback to CPF lookup
    let user = null;

    try {
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get("better-auth.session")?.value;

      if (sessionToken) {
        console.log("Looking for user by session token:", sessionToken);
        const session = await prisma.session.findFirst({
          where: { token: sessionToken },
          include: { user: true },
        });

        if (session?.user) {
          user = session.user;
          console.log("User found via session:", {
            id: user.id,
            cpf: user.cpf,
          });
        }
      }
    } catch (error) {
      console.log("Session lookup failed:", error);
    }

    // Fallback to CPF lookup if session method failed
    if (!user) {
      const cleanCpf = cpf.replace(/\D/g, "");
      console.log("Looking for user with CPF:", { originalCpf: cpf, cleanCpf });

      user = await prisma.user.findFirst({
        where: { cpf: cleanCpf },
      });

      if (user) {
        console.log("User found via CPF:", { id: user.id, cpf: user.cpf });
      }
    }

    if (!user) {
      console.error("User not found for CPF:", { originalCpf: cpf });
      return NextResponse.json(
        {
          error:
            "User not found. Please make sure you're using the same CPF from your account registration.",
        },
        { status: 404 }
      );
    }

    // Check if user already has KYC submitted
    if (user.kycStatus !== "PENDING" && user.documentType) {
      return NextResponse.json(
        { error: "KYC documents already submitted" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "kyc", user.id);
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
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

    // Save files
    const frontPath = join(uploadsDir, frontFilename);
    const backPath = join(uploadsDir, backFilename);
    const selfiePath = join(uploadsDir, selfieFilename);

    const frontBuffer = Buffer.from(await documentFront.arrayBuffer());
    const backBuffer = Buffer.from(await documentBack.arrayBuffer());
    const selfieBuffer = Buffer.from(await documentSelfie.arrayBuffer());

    await writeFile(frontPath, frontBuffer);
    await writeFile(backPath, backBuffer);
    await writeFile(selfiePath, selfieBuffer);

    // Generate URLs for database storage
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const frontUrl = `${baseUrl}/uploads/kyc/${user.id}/${frontFilename}`;
    const backUrl = `${baseUrl}/uploads/kyc/${user.id}/${backFilename}`;
    const selfieUrl = `${baseUrl}/uploads/kyc/${user.id}/${selfieFilename}`;

    // Update user with KYC data
    await prisma.user.update({
      where: { id: user.id },
      data: {
        documentType: documentType as "RG" | "HABILITACAO" | "CNH" | "PASSPORT",
        documentNumber: documentNumber,
        documentFront: frontUrl,
        documentBack: backUrl,
        documentSelfie: selfieUrl,
        kycStatus: "PENDING",
        kycSubmittedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "KYC documents submitted successfully",
      kycStatus: "PENDING",
    });
  } catch (error) {
    console.error("KYC submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit KYC documents" },
      { status: 500 }
    );
  }
}
