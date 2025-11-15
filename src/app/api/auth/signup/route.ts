import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Validate required fields (simplified - no CPF or phone needed)
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Nome, email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Email inválido" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "A senha deve ter no mínimo 8 caracteres" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Já existe uma conta com este email" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user with simplified fields (no CPF, phone, KYC)
    const user = await prisma.user.create({
      data: {
        id: `user_${Date.now()}`,
        name,
        email,
        password: hashedPassword,
        emailVerified: true, // Auto-verify for now (you can add email verification later)
        role: "CLIENT", // Default role is CLIENT
        createdAt: new Date(),
        updatedAt: new Date(),
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
      message: "Conta criada com sucesso!",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
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
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
