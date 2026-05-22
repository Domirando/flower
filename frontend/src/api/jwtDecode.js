// Decode JWT payload without verifying signature (browser-side only)
export function jwtDecode(token) {
    const [, payload] = token.split('.');
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
}
