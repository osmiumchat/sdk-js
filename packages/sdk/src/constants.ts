// Injected at build time by tsup
declare const __SDK_VERSION__: string;
export const VERSION: string = __SDK_VERSION__;

export const DEVICE_VERSION: string =
    typeof process !== "undefined" && process.version
        ? process.version
        : typeof navigator !== "undefined"
        ? navigator.userAgent
        : "unknown";
