import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, LogOut, LayoutDashboard } from "lucide-react";

export default function Home({ setScreen }) {
  return (
    <div className="bg-gradient-to-br from-slate-100 to-slate-200 py-2">

      <Card className="w-full max-w-2xl mx-auto rounded-3xl shadow-2xl">
        <CardContent className="p-12 flex flex-col gap-10">

          <Button
            className="h-24 text-2xl flex gap-4 rounded-xl"
            onClick={() => setScreen("checkin")}
          >
            <UserPlus size={30} />
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