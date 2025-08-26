import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    // Only allow this endpoint on localhost
    const host = request.headers.get("host") || "";
    if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
      return NextResponse.json(
        { error: "This endpoint is only available on localhost" },
        { status: 403 }
      );
    }

    const { email, name, cpf } = await request.json();

    if (!email || !name || !cpf) {
      return NextResponse.json(
        { error: "Email, name, and CPF are required" },
        { status: 400 }
      );
    }

    // Always use "12345678" as the password for dev users
    const password = "12345678";

    // Generate unique email and CPF for each dev user
    const timestamp = Date.now();
    const uniqueEmail = `dev${timestamp}@buildstrategy.com`;
    const uniqueCPF = `1234567890${timestamp.toString().slice(-2)}`; // Last 2 digits of timestamp

    // Update the variables to use unique values
    const finalEmail = uniqueEmail;
    const finalCPF = uniqueCPF;

    console.log("Creating dev user with password:", password);
    console.log("Password length:", password.length);

    // Hash the password with bcrypt (12 salt rounds for security)
    const hashedPassword = await hash(password, 12);
    console.log("Password hashed successfully for:", finalEmail);

    // Create the dev user directly in our system (no better-auth)
    const devUser = await prisma.user.create({
      data: {
        id: `dev-${timestamp}`,
        name: `Developer ${timestamp}`,
        email: finalEmail,
        cpf: finalCPF,
        password: hashedPassword, // Store encrypted password directly
        emailVerified: true,
        approvalStatus: "APPROVED", // Auto-approve dev users
        kycStatus: "APPROVED", // Auto-approve KYC
        kycData: {
          devUser: true,
          permissions: ["all"],
          createdAt: new Date().toISOString(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log("Dev user created successfully:", {
      userId: devUser.id,
      email: finalEmail,
      name: devUser.name,
      approvalStatus: devUser.approvalStatus,
    });

    // Create initial balance with 0 amount for new users
    await prisma.balance.create({
      data: {
        userId: devUser.id,
        currency: "BRL",
        amount: 0,
        locked: 0,
      },
    });

    // Create a session for the dev user
    const sessionId = `dev-session-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    await prisma.session.create({
      data: {
        id: sessionId,
        token: sessionId,
        userId: devUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Dev user created successfully",
      user: {
        id: devUser.id,
        email: finalEmail,
        name: devUser.name,
        password: password, // Return plain password for dev use
        approvalStatus: devUser.approvalStatus,
        sessionId: sessionId,
      },
    });
  } catch (error) {
    console.error("Dev user creation error:", error);
    return NextResponse.json(
      { error: "Failed to create dev user" },
      { status: 500 }
    );
  }
}
