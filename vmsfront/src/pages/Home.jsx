import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home({ setScreen }) {
  return (
    <Card className="rounded-2xl shadow-lg">
      <CardContent className="p-8 flex flex-col gap-6">
        <h1 className="text-3xl font-semibold text-center">Visitor Management</h1>

        <Button className="h-20 text-2xl" onClick={() => setScreen("checkin")}>Check In</Button>
        <Button className="h-20 text-2xl" onClick={() => setScreen("checkout")}>Check Out</Button>
        <Button className="h-20 text-2xl" onClick={() => setScreen("dashboard")}>Dashboard</Button>
      </CardContent>
    </Card>
  );
}