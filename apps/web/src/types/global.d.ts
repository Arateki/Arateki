export {};

declare module '*.ttf' {
  const src: string;
  export default src;
}

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
