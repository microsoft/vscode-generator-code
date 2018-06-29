
export * from "assert";

declare module "yeoman-assert" {
    export function file(args: string | string[]): void;
}