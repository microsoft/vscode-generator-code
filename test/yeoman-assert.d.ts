declare module "yeoman-assert" {
    export function file(args: string | string[]): void;
    export function deepEqual(actual: any, expected: any, message?: string): void;
    export function equal(actual: any, expected: any, message?: string): void;
}