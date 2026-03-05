import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, LogOut, LayoutDashboard } from "lucide-react";

export default function Home({ setScreen }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-6">

      <Card className="w-full max-w-2xl rounded-3xl shadow-2xl">
        <CardContent className="p-12 flex flex-col gap-10">

          <div className="text-center">
            <h1 className="text-4xl font-bold">Visitor Management</h1>
            <p className="text-gray-500 mt-2 text-lg">
              Welcome — Please select an option
            </p>
          </div>

          <Button
            className="h-24 text-2xl flex gap-4 rounded-xl"
            onClick={() => setScreen("checkin")}
          >
            <UserPlus size={32} />
            Check In
          </Button>

          <Button
            className="h-24 text-2xl flex gap-4 rounded-xl"
            variant="secondary"
            onClick={() => setScreen("checkout")}
          >
            <LogOut size={32} />
            Check Out
          </Button>

          <Button
            className="h-24 text-2xl flex gap-4 rounded-xl"
            variant="outline"
            onClick={() => setScreen("dashboard")}
          >
            <LayoutDashboard size={32} />
            Dashboard
          </Button>

        </CardContent>
      </Card>

    </div>
  );
}