export {};

declare global {
  interface NavigatorUAData {
    readonly platform: string;
    readonly brands: { brand: string; version: string }[];
    readonly mobile: boolean;
  }

  interface Navigator {
    userAgentData?: NavigatorUAData;
  }
}
