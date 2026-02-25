import { NextRequest, NextResponse } from "next/server";

// IMPORTANT: Use 127.0.0.1 (not "localhost") because macOS resolves localhost
// to IPv6 [::1] first, and uvicorn only listens on IPv4 by default.
// In production, env vars like NEXT_PUBLIC_API_BASE_URL will be used.
const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

async function proxyRequest(
    request: NextRequest,
    method: string,
    pathSegments: string[]
) {
    const backendPath = "/" + pathSegments.join("/");
    const url = `${BACKEND_URL}${backendPath}`;

    // Forward Authorization header
    const headers: Record<string, string> = {};
    const authHeader = request.headers.get("Authorization");
    if (authHeader) {
        headers["Authorization"] = authHeader;
        console.log(`[proxy] Auth header present. Length: ${authHeader.length}, Preview: ${authHeader.substring(0, 15)}...`);
    } else {
        console.log(`[proxy] No Auth header present in request.`);
    }

    // Only set Content-Type for methods that have a body
    if (method === "POST" || method === "PUT" || method === "PATCH") {
        headers["Content-Type"] = "application/json";
    }

    try {
        const fetchOptions: RequestInit = { method, headers, cache: "no-store" };

        // Read body for POST/PUT/PATCH
        if (method === "POST" || method === "PUT" || method === "PATCH") {
            const bodyText = await request.text();
            if (bodyText) {
                fetchOptions.body = bodyText;
            }
        }

        console.log(`[proxy] ${method} ${url}`);
        const resp = await fetch(url, fetchOptions);

        // Read the raw response text first
        const responseText = await resp.text();

        // Try to parse as JSON, if it fails just return the text
        try {
            const data = JSON.parse(responseText);
            return NextResponse.json(data, { status: resp.status });
        } catch {
            // Not JSON — return the raw text with the backend's status
            console.error(`[proxy] Non-JSON response from ${url}: ${responseText.substring(0, 200)}`);
            return NextResponse.json(
                { detail: responseText.substring(0, 500) || `Backend error (HTTP ${resp.status})` },
                { status: resp.status }
            );
        }
    } catch (err: any) {
        console.error(`[proxy] Connection error for ${method} ${url}:`, err.message);
        console.error(`[proxy] Error cause:`, err.cause);
        if (err.cause) {
            console.error(`[proxy] Error cause details:`, JSON.stringify(err.cause, Object.getOwnPropertyNames(err.cause)));
        }
        return NextResponse.json(
            { detail: `Backend unreachable at ${BACKEND_URL}: ${err.message}` },
            { status: 502 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    return proxyRequest(request, "POST", path);
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    return proxyRequest(request, "GET", path);
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    return proxyRequest(request, "PUT", path);
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    return proxyRequest(request, "DELETE", path);
}
