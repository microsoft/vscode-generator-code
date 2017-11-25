
export * from "assert";

declare module "assert" {
    export function file(args: string | string[]): void;
}