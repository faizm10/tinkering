import { auth } from "@/lib/auth/auth";

export default auth.middleware({
  loginUrl: "/login",
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/events/:path*",
    "/tasks/:path*",
    "/waiting/:path*",
    "/approvals/:path*",
    "/history/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
  ],
};
