
// Partial typings only

declare module "yeoman-generator" {
    private interface YeomanBase {
        extend(args: any);
        apply(_this: any, arguments: any)
    }
    declare var Base: YeomanBase;
}