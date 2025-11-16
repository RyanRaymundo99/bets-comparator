"use client";

import React, { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function MyBetPage() {
  const params = useParams();
  const router = useRouter();
  const userBetId = params.id as string;

  useEffect(() => {
    // Redirect to parameters page
    if (userBetId) {
      router.replace(`/my-bet/${userBetId}/parameters`);
    }
  }, [userBetId, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-gray-300">Carregando...</p>
      </div>
    </div>
  );
}

