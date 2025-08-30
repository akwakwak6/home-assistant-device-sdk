import { defineConfig, Options } from "tsup";
import { chmodSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

export default defineConfig(() => {
    const env = process.env.TSUP_ENV || "default";

    const options: Options = {
        target: "es2022",
        clean: true,
        format: ["esm"],
        treeshake: true,
    };

    if (env === "mock") {
        options.entry = ["src/scripts/buildHaCli.mock.ts"];
        options.outDir = "local/dist";
        options.sourcemap = true;
        return options;
    }

    options.entry = ["src/scripts/buildHaCli.ts", "src/index.ts"];
    options.outDir = "dist";
    options.dts = true;
    options.minify = true;
    options.splitting = false;
    options.onSuccess = async () => {
        const cliFile = "dist/scripts/buildHaCli.js";
        const jsFile = "dist/index.js";
        const banner = "// Copyright (c) 2025 akwakwak\n// Licensed under the MIT License\n\n";
        const shebang = "#!/usr/bin/env node\n\n";

        const contentJs = readFileSync(jsFile, "utf-8");
        writeFileSync(jsFile, banner + contentJs);

        const contentCli = readFileSync(cliFile, "utf-8");
        writeFileSync(cliFile, shebang + banner + contentCli);
        chmodSync(cliFile, 0o755);
    };

    return options;
});
