import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Get all users with KYC data
    const users = await prisma.user.findMany({
      where: {
        documentType: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        documentType: true,
        documentNumber: true,
        documentFront: true,
        documentBack: true,
        documentSelfie: true,
        kycStatus: true,
        kycSubmittedAt: true,
        kycReviewedAt: true,
        kycRejectionReason: true,
        createdAt: true,
      },
      orderBy: {
        kycSubmittedAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Error fetching KYC users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
