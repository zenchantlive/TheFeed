"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { AdminSidebar } from "./sidebar";

type AdminMobileNavProps = {
    userName: string;
};

export function AdminMobileNav({ userName }: AdminMobileNavProps) {
    const [open, setOpen] = useState(false);

    return (
        <div className="flex items-center border-b bg-card px-6 py-4 lg:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="mr-4">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72">
                    <AdminSidebar
                        userName={userName}
                        className="h-full w-full border-none"
                        onNavigate={() => setOpen(false)}
                    />
                </SheetContent>
            </Sheet>
            <div className="font-semibold">Admin Dashboard</div>
        </div>
    );
}
