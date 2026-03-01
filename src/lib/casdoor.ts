import type Sdk from "casdoor-js-sdk";

const TOKEN_KEY = "casdoor_token";

// Lazy SDK singleton — only instantiated in the browser (window exists)
let _sdk: Sdk | null = null;

export function getSdk(): Sdk {
  if (typeof window === "undefined") {
    throw new Error("Casdoor SDK can only be used in the browser");
  }
  if (!_sdk) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SdkClass = require("casdoor-js-sdk").default;
    _sdk = new SdkClass({
      serverUrl: process.env.NEXT_PUBLIC_CASDOOR_ENDPOINT ?? "http://localhost:8000",
      clientId: process.env.NEXT_PUBLIC_CASDOOR_CLIENT_ID ?? "placeholder-client-id",
      organizationName: process.env.NEXT_PUBLIC_CASDOOR_ORGANIZATION ?? "built-in",
      appName: process.env.NEXT_PUBLIC_CASDOOR_APP_NAME ?? "marketplace-helper",
      redirectPath: "/callback",
      signinPath: "/api/signin",
    }) as Sdk;
  }
  return _sdk!;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
