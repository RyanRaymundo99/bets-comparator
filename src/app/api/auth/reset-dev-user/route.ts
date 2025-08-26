import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

    // Clear all existing dev users and their data
    const devUsers = await prisma.user.findMany({
      where: {
        email: { startsWith: "dev" },
      },
    });

    for (const user of devUsers) {
      // Delete related data first
      await prisma.transaction.deleteMany({
        where: { userId: user.id },
      });

      await prisma.balance.deleteMany({
        where: { userId: user.id },
      });

      await prisma.order.deleteMany({
        where: { userId: user.id },
      });

      await prisma.session.deleteMany({
        where: { userId: user.id },
      });

      await prisma.account.deleteMany({
        where: { userId: user.id },
      });

      // Delete the user
      await prisma.user.delete({
        where: { id: user.id },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Cleared ${devUsers.length} dev users and all related data`,
      clearedUsers: devUsers.length,
    });
  } catch (error) {
    console.error("Error resetting dev users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
