import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    const sessionCookie =
        request.cookies.get("better-auth.session_token") ||
        request.cookies.get("__Secure-better-auth.session_token");

    const isLoginPage = request.nextUrl.pathname.startsWith("/login");
    const isApiRoute = request.nextUrl.pathname.startsWith("/api");

    if (!sessionCookie && !isLoginPage && !isApiRoute) {
        const returnUrl = request.nextUrl.pathname + request.nextUrl.search;
        const url = new URL("/login", request.url);
        // searchParams.set automatically encodes the value
        url.searchParams.set("returnUrl", returnUrl);
        return NextResponse.redirect(url);
    }
    return NextResponse.next();
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/profile/:path*",
        "/admin/:path*",
        "/community/events/new",
        "/community/events/calendar",
    ],
};
