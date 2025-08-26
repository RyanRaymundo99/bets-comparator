import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";
import { getAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { name, email, cpf, password } = await request.json();

    // Validate required fields
    if (!name || !email || !cpf || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { cpf }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or CPF already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user with better-auth
    try {
      const auth = getAuth();

      // Create user through better-auth
      const user = await auth.database.createUser({
        data: {
          name,
          email,
          cpf,
          emailVerified: true,
          approvalStatus: "APPROVED", // Auto-approve users
          kycStatus: "APPROVED", // Auto-approve KYC
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Create password account
      await auth.database.createAccount({
        data: {
          userId: user.id,
          providerId: "email",
          accountId: email,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Create initial balance (0 balance for new users)
      await prisma.balance.create({
        data: {
          userId: user.id,
          currency: "BRL",
          amount: 0,
          locked: 0,
        },
      });

      // Create a session for the user
      const sessionId = `session-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      await prisma.session.create({
        data: {
          id: sessionId,
          token: sessionId,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Set the session cookie
      const response = NextResponse.json({
        success: true,
        message: "Account created successfully! Welcome to BS Market!",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          approvalStatus: user.approvalStatus,
        },
        sessionId: sessionId,
      });

      // Set the session cookie
      response.cookies.set("better-auth.session", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        path: "/",
      });

      return response;
    } catch (authError) {
      console.error("Better-auth error:", authError);

      // Fallback: create user directly in database
      const user = await prisma.user.create({
        data: {
          id: `user_${Date.now()}`,
          name,
          email,
          cpf,
          password: hashedPassword,
          emailVerified: true,
          approvalStatus: "APPROVED", // Auto-approve users
          kycStatus: "APPROVED", // Auto-approve KYC
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Create initial balance
      await prisma.balance.create({
        data: {
          userId: user.id,
          currency: "BRL",
          amount: 0,
          locked: 0,
        },
      });

      // Create a session for the user
      const sessionId = `session-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      await prisma.session.create({
        data: {
          id: sessionId,
          token: sessionId,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Set the session cookie
      const response = NextResponse.json({
        success: true,
        message: "Account created successfully! Welcome to BS Market!",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          approvalStatus: user.approvalStatus,
        },
        sessionId: sessionId,
      });

      // Set the session cookie
      response.cookies.set("better-auth.session", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        path: "/",
      });

      return response;
    }
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
