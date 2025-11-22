import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const Home = () => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Link href="/login">
        <Button
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-6 text-lg rounded-lg"
        >
          Login
        </Button>
      </Link>
    </div>
  );
};

export default Home;
