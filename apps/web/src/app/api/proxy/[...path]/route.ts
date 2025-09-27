import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";

const INTERNAL_API_URL = process.env.INTERNAL_API_URL;

if (!INTERNAL_API_URL) {
  throw new Error("INTERNAL_API_URL is not defined in environment variables.");
}

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  
  const path = resolvedParams.path.join("/");
  const url = `${INTERNAL_API_URL}/api/v1/${path}`;
  
  // Session'dan access_token çek
  const accessToken = (session as any)?.accessToken;
  
  // Health gibi public endpoint'ler için token zorunlu değil
  const isPublicEndpoint = path === 'health' || path.startsWith('auth/');
  
  if (!accessToken && !isPublicEndpoint) {
    logger.warn("API", "No access token found in session.", { path: resolvedParams.path });
    return NextResponse.json({ error: "NO_ACCESS_TOKEN" }, { status: 401 });
  }

  try {
    const headers = new Headers(req.headers);
    
    // Token varsa Authorization header ekle
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
      console.log("[PROXY]", path, "hasToken:", !!accessToken); // Geçici debug
    }
    
    // Remove unnecessary headers
    headers.delete("host");
    headers.delete("cookie"); // API'ye web cookie'lerini taşımayalım

    const response = await fetch(url, {
      method: req.method,
      headers: headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
      // Duplex is required for streaming request bodies
      // @ts-ignore
      duplex: "half",
    });

    // If the response is a redirect, follow it
    if (response.status >= 300 && response.status < 400 && response.headers.has("location")) {
      return NextResponse.redirect(response.headers.get("location")!, {
        status: response.status
      });
    }

    // Stream the response back to the client
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error: any) {
    logger.error("API", "Proxy request failed.", {
      url,
      method: req.method,
      error: error.message,
    });
    return NextResponse.json(
      { error: "PROXY_REQUEST_FAILED", detail: error.message },
      { status: 500 }
    );
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };
