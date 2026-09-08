import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/env";

const PROTECTED = ["/dashboard", "/profile"];
const AUTH_PAGES = ["/login", "/signup"];

/** Strips a /ru prefix so the checks below work for both languages. */
function withoutLocale(pathname: string): { path: string; prefix: string } {
  if (pathname === "/ru") return { path: "/", prefix: "/ru" };
  if (pathname.startsWith("/ru/")) return { path: pathname.slice(3), prefix: "/ru" };
  return { path: pathname, prefix: "" };
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // With no Supabase project connected the site still works — every
  // browser-based PDF tool is usable without an account.
  if (!isSupabaseConfigured()) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getUser revalidates the token with Supabase; getSession would trust the
  // cookie as sent, which is not safe for an access decision.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  // A Russian visitor who is redirected should land on the Russian page.
  const { path, prefix } = withoutLocale(pathname);

  if (!user && PROTECTED.some((entry) => path.startsWith(entry))) {
    const url = request.nextUrl.clone();
    url.pathname = `${prefix}/login`;
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && AUTH_PAGES.some((entry) => path.startsWith(entry))) {
    const url = request.nextUrl.clone();
    url.pathname = `${prefix}/dashboard`;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
