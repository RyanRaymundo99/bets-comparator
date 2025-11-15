import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/parameters/[id]/history - Get parameter history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");

    // Check if parameter exists
    const parameter = await prisma.parameter.findUnique({
      where: { id },
      include: {
        bet: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!parameter) {
      return NextResponse.json(
        { success: false, error: "Parameter not found" },
        { status: 404 }
      );
    }

    // Get history
    const history = await prisma.parameterHistory.findMany({
      where: { parameterId: id },
      orderBy: { createdAt: "desc" },
      ...(limit && { take: parseInt(limit) }),
    });

    return NextResponse.json({
      success: true,
      parameter: {
        id: parameter.id,
        name: parameter.name,
        bet: parameter.bet,
      },
      history,
    });
  } catch (error) {
    console.error("Error fetching parameter history:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch parameter history" },
      { status: 500 }
    );
  }
}

