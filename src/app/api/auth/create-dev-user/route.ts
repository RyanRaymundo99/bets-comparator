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
        approvalStatus: "APPROVED",
        kycStatus: "APPROVED",
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

    // Create initial balances for the dev user
    await prisma.balance.createMany({
      data: [
        {
          userId: devUser.id,
          currency: "BRL",
          amount: 10000, // 10,000 BRL
          locked: 0,
        },
        {
          userId: devUser.id,
          currency: "BTC",
          amount: 1, // 1 BTC
          locked: 0,
        },
        {
          userId: devUser.id,
          currency: "ETH",
          amount: 10, // 10 ETH
          locked: 0,
        },
        {
          userId: devUser.id,
          currency: "USDT",
          amount: 10000, // 10,000 USDT
          locked: 0,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      user: {
        id: devUser.id,
        name: devUser.name,
        email: devUser.email,
        cpf: devUser.cpf,
        approvalStatus: devUser.approvalStatus,
        kycStatus: devUser.kycStatus,
      },
      message: "Dev user created successfully with all permissions",
      credentials: {
        email: finalEmail,
        password: "12345678",
      },
    });
  } catch (error) {
    console.error("Error creating dev user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
