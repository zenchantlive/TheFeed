"use client";

import { Calendar, PenSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
    DrawerClose,
    DrawerFooter,
} from "@/components/ui/drawer";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreateEventModal } from "@/components/events/create-event-modal";

interface CreatePostDrawerProps {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function CreatePostDrawer({ children, open: controlledOpen, onOpenChange: setControlledOpen }: CreatePostDrawerProps) {
    const router = useRouter();
    const [internalOpen, setInternalOpen] = useState(false);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);

    const isControlled = controlledOpen !== undefined;
    const isOpen = isControlled ? controlledOpen : internalOpen;
    const setIsOpen = isControlled ? setControlledOpen : setInternalOpen;

    const handleAction = (path: string) => {
        if (setIsOpen) setIsOpen(false);
        router.push(path);
    };

    const handleHostEvent = () => {
        if (setIsOpen) setIsOpen(false);
        setIsEventModalOpen(true);
    };

    return (
        <>
            <CreateEventModal
                open={isEventModalOpen}
                onOpenChange={setIsEventModalOpen}
            />
            <Drawer open={isOpen} onOpenChange={setIsOpen}>
                <DrawerTrigger asChild>
                    {children}
                </DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Create & Share</DrawerTitle>
                    </DrawerHeader>
                    <div className="grid gap-4 p-4 pb-8">
                        <Button
                            variant="outline"
                            className="flex h-auto flex-col items-center gap-2 py-6"
                            onClick={() => handleAction("/community?action=post")}
                        >
                            <PenSquare className="h-8 w-8 text-primary" />
                            <span className="font-medium">Create Post</span>
                            <span className="text-xs text-muted-foreground">Share food or ask for help</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex h-auto flex-col items-center gap-2 py-6"
                            onClick={handleHostEvent}
                        >
                            <Calendar className="h-8 w-8 text-emerald-600" />
                            <span className="font-medium">Host Event</span>
                            <span className="text-xs text-muted-foreground">Organize a potluck or drive</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex h-auto flex-col items-center gap-2 py-6"
                            onClick={() => handleAction("/chat")}
                        >
                            <Sparkles className="h-8 w-8 text-amber-500" />
                            <span className="font-medium">Ask Sous-chef</span>
                            <span className="text-xs text-muted-foreground">Get AI assistance</span>
                        </Button>
                    </div>
                    <DrawerFooter>
                        <DrawerClose asChild>
                            <Button variant="ghost">Cancel</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </>
    );
}
