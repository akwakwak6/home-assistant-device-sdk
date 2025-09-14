// prettier-ignore
import { CLASS_INIT_LIST, DEFAULT_OUT_PATH, DEVICE_TYPES, ENCODING_FILE, HEADER, IMPORTS_LIST } from "../../constants/haFileConstantes";
import { IBuilderHaOption, IDeviceToBuild } from "../../types/entities/deviceBuilder.type";
import { IConfig } from "src/types/entities/configDal.type";
import { ConfigService } from "src/utils/services/config.service";
import { IStateDtoIn } from "src/types/dto/in/base.dto.in";
import { getStates } from "../services/ha.service";
import { DeviceType } from "src/types/utilsTypes";
import { DeviceBuilder } from "./device.builder";
import { LightBuilder } from "./light.builder";
import path from "path";
import fs from "fs";

type IDeviceToBuildByType = { [key: string]: IDeviceToBuild[] };
type MergedStateAndConfig = { devicesToBuild: IDeviceToBuildByType; newConfig: IConfig };

export async function buildHaFile(options: IBuilderHaOption = {}, states?: IStateDtoIn[]) {
    const dal = options?.configDal ?? new ConfigService(options?.configPath);
    const config = await dal.getAllConfig();
    const { url, token } = getCredentialsFromOptions(options, config);
    states = states ?? (await getStates(url, token));

    const { newConfig, content } = buildHaClass(states, config);
    await dal.setDevices(newConfig.devices);

    const outPath = path.resolve(options?.out || DEFAULT_OUT_PATH);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, content, ENCODING_FILE);
    console.log(`File generated to ${outPath}`);
    return content;
}

export function buildHaClass(states: IStateDtoIn[], config: Partial<IConfig>): { newConfig: IConfig; content: string } {
    const { newConfig, devicesToBuild } = mergeStateAndConfig(states, config);

    const imports = [...IMPORTS_LIST];

    const variablesToAdd: string[] = ["", ""];

    const classHa = [...CLASS_INIT_LIST];

    const devicesByType: { [key: string]: string[] } = {};

    Object.entries(devicesToBuild).forEach(([deviceType, devicesOfType]) => {
        const deviceOfTypeBuilder = getDeviceOfTypeBuilder(deviceType as DeviceType);

        devicesOfType.forEach((deviceToBuild) => {
            deviceOfTypeBuilder.buildDevice(deviceToBuild);

            classHa.push(`\t\t${deviceToBuild.name}: ${deviceOfTypeBuilder.getNewInstanceLine()},`);

            deviceOfTypeBuilder.getDeviceTypes().forEach((deviceType) => {
                if (!devicesByType[deviceType]) {
                    devicesByType[deviceType] = [];
                }
                devicesByType[deviceType].push(deviceToBuild.name);
            });
        });
        imports.push(deviceOfTypeBuilder.getImportsLine());
        variablesToAdd.push(...deviceOfTypeBuilder.getVariableToAddLine());
    });

    classHa.push(`\t};`);

    Object.entries(devicesByType).forEach(([deviceType, devices]) => {
        const devicesList = devices.map((name) => `this.devices.${name}`).join(", ");
        classHa.push(`\tpublic static readonly ${deviceType}s = [${devicesList}];`);
    });

    const content = HEADER + imports.join("\n") + variablesToAdd.join("\n") + classHa.join("\n") + "\n}\n";
    return { newConfig, content };
}

export function mergeStateAndConfig(states: IStateDtoIn[], config: Partial<IConfig>): MergedStateAndConfig {
    const newConfig: IConfig = {
        devices: {},
        deviceType: {},
        credentials: { url: "", token: "" },
        ...config,
    };

    const entities = newConfig.devices;

    const uniqueName = uniqueNameFactory();

    const deviceToRemove: string[] = [];
    const justCheck = true;

    Object.keys(entities).forEach((entityId) => {
        entities[entityId].wasDetected = false;
        entities[entityId].name = uniqueName(entities[entityId].name, justCheck);
        if (config.deviceType?.[entities[entityId].type as DeviceType] === false) {
            deviceToRemove.push(entityId);
        }
    });
    deviceToRemove.forEach((entityId) => {
        delete entities[entityId];
    });

    const devices: IDeviceToBuildByType = {};

    states.forEach((state) => {
        const deviceType = state.entity_id.split(".")[0];

        if (!DEVICE_TYPES.includes(deviceType as DeviceType)) {
            return;
        }

        if (newConfig.deviceType?.[deviceType as DeviceType] === false) {
            return;
        }

        const deviceId = state.entity_id;
        if (entities[deviceId] && entities[deviceId].type === deviceType) {
            entities[deviceId].wasDetected = true;
        } else {
            entities[deviceId] = {
                name: uniqueName(state.attributes.friendly_name),
                wasDetected: true,
                type: deviceType,
                isUsed: true,
            };
        }

        const entity = entities[deviceId];

        if (!devices[entity.type]) {
            devices[entity.type] = [];
        }

        devices[entity.type].push({
            attributes: state.attributes,
            name: entity.name,
            id: deviceId,
            type: deviceType,
        });
    });

    return { newConfig, devicesToBuild: devices };
}

function getDeviceOfTypeBuilder(deviceType: DeviceType): DeviceBuilder {
    switch (deviceType) {
        case "light":
            return new LightBuilder();
        default:
            return new DeviceBuilder();
    }
}

function uniqueNameFactory(): (friendlyName: string, justCheck?: boolean) => string {
    const usedNames = new Set<string>();
    return (friendlyName: string, justCheck: boolean = false) => {
        let baseName = justCheck ? toSafeVariableName(friendlyName) : toVariableName(friendlyName);
        let name = baseName;
        let counter = 1;

        while (usedNames.has(name)) {
            counter++;
            name = baseName + counter;
        }

        usedNames.add(name);
        return name;
    };
}

function toSafeVariableName(str: string): string {
    if (!str.trim()) {
        return "unknown";
    }
    let cleaned = str.replace(/[\s_]+/g, "");
    cleaned = cleaned.replace(/[^A-Za-z0-9$]/g, "");
    if (/^[0-9]/.test(cleaned)) {
        cleaned = "_" + cleaned;
    }
    if (!cleaned) {
        return "unknown";
    }
    return cleaned;
}

function toVariableName(str: string): string {
    let cleaned = str.replace(/[^A-Za-z0-9 _]/g, " ");

    const parts = cleaned.trim().split(/[\s_]+/);

    if (parts.length === 0) return "unknown";
    let result = parts[0].toLowerCase();
    for (let i = 1; i < parts.length; i++) {
        const word = parts[i];
        result += word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }

    if (/^[0-9]/.test(result)) {
        result = "_" + result;
    }

    return result;
}

function getCredentialsFromOptions(options: IBuilderHaOption, config: Partial<IConfig>): { url: string; token: string } {
    const url = options.url || process.env.HA_URL || config.credentials?.url;
    const token = options.token || process.env.HA_TOKEN || config.credentials?.token;

    if (!url) {
        throw new Error("Missing url");
    }

    if (!token) {
        throw new Error("Missing token");
    }

    return { url, token };
}
