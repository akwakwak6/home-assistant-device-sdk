import { buildHaFile } from "../utils/builders/ha.builder";
import { DEFAULT_OUT_PATH } from "src/constants/haFileConstantes";
import pkg from "../../package.json";
import { Command } from "commander";
import { IBuilderHaOption } from "src/types/devices/deviceBuilder.type";

const program = new Command();

program
    .name("hagen")
    .description("Home Assistant code generator")
    .version(pkg.version)
    .option("-u, --url <url>", "Home Assistant URL", process.env.HA_URL)
    .option("-t, --token <token>", "Home Assistant token", process.env.HA_TOKEN)
    .option("-o, --out <file>", "Output file path", DEFAULT_OUT_PATH);

program.parse(process.argv);
const options = program.opts();

if (!options.url || !options.token) {
    throw new Error("Missing credentials: provide --url and --token or set HA_URL / HA_TOKEN env vars");
}

buildHaFile(options as IBuilderHaOption);
