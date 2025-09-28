import { describe, it, expect, vi, afterAll } from "vitest";
import { DEFAULT_CONFIG_PATH, DEFAULT_OUT_PATH, ENCODING_FILE } from "../../constants/haFileConstantes";
import { IBuilderHaOption } from "../../types/devices/deviceBuilder.type";
import { ConfigServiceMock } from "../services/config.service.mock";
import { getStatesMock } from "../services/ha.service.mock";
import { buildHaFile } from "./ha.builder";
import { CONFIG_MOCK } from "../../mocks/config.mock";
import * as haService from "../services/ha.service";
import path from "path";
import fs from "fs";

describe("buildHaFile", () => {
    const spyWriteFileSync = vi.spyOn(fs, "writeFileSync").mockImplementation(() => undefined);
    const spyMkdirSync = vi.spyOn(fs, "mkdirSync").mockImplementation(() => undefined);
    const spyGetStates = vi.spyOn(haService, "getStates").mockImplementation(getStatesMock);

    describe("options invalid", () => {
        it("should throw error cause no url", async () => {
            const options: IBuilderHaOption = { configDal: new ConfigServiceMock(DEFAULT_CONFIG_PATH, {}) };
            await expect(async () => await buildHaFile(options)).rejects.toThrowError("Missing url");
        });
        it("should throw error cause no token", async () => {
            const options: IBuilderHaOption = { configDal: new ConfigServiceMock(DEFAULT_CONFIG_PATH, { credentials: { url: "url" } }) };
            await expect(async () => await buildHaFile(options)).rejects.toThrowError("Missing token");
        });
    });

    describe("option out", () => {
        it("should call writeFileSync with default out path", async () => {
            const options: IBuilderHaOption = { url: "url", token: "token" };
            await buildHaFile(options);
            const outPath = path.resolve(DEFAULT_OUT_PATH);
            expect(spyMkdirSync).toHaveBeenCalledWith(path.dirname(outPath), { recursive: true });
            expect(spyWriteFileSync).toHaveBeenCalledWith(path.resolve(DEFAULT_OUT_PATH), expect.any(String), ENCODING_FILE);
        });
        it("should call writeFileSync with out path", async () => {
            const options: IBuilderHaOption = { url: "url", token: "token", out: "out" };
            await buildHaFile(options);
            const outPath = path.resolve("out");
            expect(spyMkdirSync).toHaveBeenCalledWith(path.dirname(outPath), { recursive: true });
            expect(spyWriteFileSync).toHaveBeenCalledWith(path.resolve("out"), expect.any(String), ENCODING_FILE);
        });
    });

    describe("options url token", () => {
        const options: IBuilderHaOption = {
            configDal: new ConfigServiceMock(DEFAULT_CONFIG_PATH, { credentials: { url: "configUrl", token: "configToken" } }),
        };
        it("should call getStates with config url and token", async () => {
            await buildHaFile(options);
            expect(spyGetStates).toHaveBeenCalledWith("configUrl", "configToken");
        });
        it("should call getStates with env var url and token", async () => {
            process.env.HA_URL = "process.env.HA_URL";
            process.env.HA_TOKEN = "process.env.HA_TOKEN";
            await buildHaFile(options);
            expect(spyGetStates).toHaveBeenCalledWith("process.env.HA_URL", "process.env.HA_TOKEN");
        });
        it("should call getStates with param url and token", async () => {
            options.url = "paramUrl";
            options.token = "paramToken";
            await buildHaFile(options);
            expect(spyGetStates).toHaveBeenCalledWith("paramUrl", "paramToken");
        });

        afterAll(() => {
            console.log("remove env var");
            delete process.env.HA_URL;
            delete process.env.HA_TOKEN;
        });
    });

    it("content of file should be like src/mocks/ha.mock.ts", async () => {
        const expectedContent = fs.readFileSync("src/mocks/ha.mock.ts", ENCODING_FILE);
        const content = await buildHaFile({ url: "url", token: "token", configDal: new ConfigServiceMock("", {}) });
        expect(normalize(content)).toBe(normalize(expectedContent));
    });

    it("content of file should be like src/mocks/haWithConfig.mock.ts", async () => {
        const expectedContent = fs.readFileSync("src/mocks/haWithConfig.mock.ts", ENCODING_FILE);
        const configServiveMock = new ConfigServiceMock(DEFAULT_CONFIG_PATH, CONFIG_MOCK);
        const content = await buildHaFile({ url: "url", token: "token", configDal: configServiveMock });
        expect(normalize(content)).toBe(normalize(expectedContent));
    });

    it("should handle deviceType with light disabled", async () => {
        const configWithLightDisabled = {
            credentials: { url: "configUrl", token: "configToken" },
            entities: {},
            deviceType: { light: false },
        };
        const configServiceMock = new ConfigServiceMock(DEFAULT_CONFIG_PATH, configWithLightDisabled);

        const content = await buildHaFile({
            url: "url",
            token: "token",
            configDal: configServiceMock,
        });

        // Verify that light devices are not included when light is disabled
        expect(content).not.toContain("new Light(");
        expect(content).not.toContain("LightBuilder");

        // Verify the config was updated with the merged state
        const updatedConfig = await configServiceMock.getAllConfig();
        expect(updatedConfig.deviceType.light).toBe(false);
    });
});

function normalize(str: string) {
    return str
        .replace(/\s+/g, " ") // compress all spaces
        .replace(/,\s*([\]}])/g, "$1") // remove comma before ] or }
        .replace(/\{\s+/g, "{") // remove space after {
        .replace(/\[\s+/g, "[") // remove space after [
        .replace(/\s+\}/g, "}") // remove space before }
        .replace(/\s+\]/g, "]") // remove space before ]
        .trim();
}
