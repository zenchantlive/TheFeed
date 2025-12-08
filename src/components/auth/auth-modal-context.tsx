"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface AuthModalContextType {
    isOpen: boolean;
    returnUrl: string | null;
    openLogin: (returnUrl?: string) => void;
    closeLogin: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [returnUrl, setReturnUrl] = useState<string | null>(null);

    const openLogin = (url?: string) => {
        // If a url is provided, set it. Otherwise rely on current path or default
        if (url) {
            setReturnUrl(url);
        } else if (typeof window !== "undefined") {
            setReturnUrl(window.location.pathname + window.location.search + window.location.hash);
        }
        setIsOpen(true);
    };

    const closeLogin = () => {
        setIsOpen(false);
        setReturnUrl(null);
    };

    return (
        <AuthModalContext.Provider value={{ isOpen, returnUrl, openLogin, closeLogin }}>
            {children}
        </AuthModalContext.Provider>
    );
}

export function useAuthModal() {
    const context = useContext(AuthModalContext);
    if (context === undefined) {
        throw new Error("useAuthModal must be used within an AuthModalProvider");
    }
    return context;
}
