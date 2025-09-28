import { LightAttributesDto } from "src/types/dto/in/light.dto.in";
import { toUpperCase } from "../mappers/string.mapper";
import { DeviceBuilder } from "./device.builder";
import { IDeviceToBuild } from "src/types/devices/deviceBuilder.type";

enum LightTypes {
    ON_OFF = "ILight",
    BRIGHTNESS = "ILightBrightness",
    TEMPERATURE = "ILightTemperature",
    COLOR = "ILightColor",
    TRANSITION = "IlightTransition",
    EFFET = "IlightEffect",
    TRANSITION_EFFET = "IlightTransitionEffect",
}

const FEATURES_TRANSITION = 32;
const FEATURES_EFFET = 4;

export class LightBuilder extends DeviceBuilder {
    private setInterfaceToImport = new Set<string>(["Light"]);
    private variablesAdded = new Map<string, string>();
    private variableEffetsAddedCpt = 0;
    private variableOptionAddedCpt = 0;

    private effectVariableName?: string;
    private optionVariableName?: string;
    private interfaceToUse!: string;
    private deviceTypes!: string[];

    public override buildDevice(deviceToBuild: IDeviceToBuild<LightAttributesDto>): void {
        this.effectVariableName = undefined;
        this.optionVariableName = undefined;
        super.buildDevice(deviceToBuild);

        const colorMode = deviceToBuild.attributes.supported_color_modes;
        const supportedFeatures = deviceToBuild.attributes.supported_features;
        const lightType = this.getLightType(colorMode, supportedFeatures);
        this.setInterfaceToImport.add(lightType);

        if (this.isInterfaceWithEffect(lightType)) {
            const effectList = deviceToBuild.attributes.effect_list;
            this.effectVariableName = this.getEffectVariableName(effectList);
        }
        this.interfaceToUse = this.getInterfaceToUse(lightType);
        this.deviceTypes = this.deviceTypeFromLightType(lightType);

        this.optionVariableName = this.getOptionVariableName(deviceToBuild, lightType);
    }

    public override getNewInstanceLine(): string {
        const option = this.optionVariableName ? `, ${this.optionVariableName}` : "";
        return `new Light("${this.deviceId}", "${this.uniqueName}"${option}) as ${this.interfaceToUse}`;
    }

    public override getDeviceTypes(): string[] {
        return this.deviceTypes;
    }

    public override getImportsLine(): string {
        return `import {${Array.from(this.setInterfaceToImport).join(", ")}} from "home-assistant-device-sdk";`;
    }

    public override getVariableToAddLine(): string[] {
        return Array.from(this.variablesAdded).map(([list, name]) => `const ${name} = {${list}};`);
    }

    private deviceTypeFromLightType(lightType: LightTypes): string[] {
        const types = ["light"];
        if (lightType === LightTypes.ON_OFF) {
            return types;
        }
        types.push("lightBrightness");
        if (lightType === LightTypes.BRIGHTNESS) {
            return types;
        }
        types.push("lightTemperature");
        if (lightType === LightTypes.TEMPERATURE) {
            return types;
        }
        types.push("lightColor");
        if (lightType === LightTypes.COLOR) {
            return types;
        }
        if (lightType === LightTypes.TRANSITION) {
            types.push("lightTransition");
            return types;
        }
        if (lightType === LightTypes.EFFET) {
            types.push("lightEffect");
            return types;
        }
        if (lightType === LightTypes.TRANSITION_EFFET) {
            types.push("lightEffect");
            types.push("lightTransition");
            types.push("lightTransitionEffect");
            return types;
        }
        throw new Error("Light type not found");
    }

    private getOptionVariableName = (deviceToBuild: IDeviceToBuild<LightAttributesDto>, lightType: LightTypes): string | undefined => {
        const optionString = this.getOptionString(deviceToBuild, lightType);
        if (!optionString) {
            return undefined;
        }
        if (this.variablesAdded.has(optionString)) {
            return this.variablesAdded.get(optionString)!;
        }
        this.variableOptionAddedCpt++;
        const variableName = `LightOption${this.variableOptionAddedCpt}`;
        this.variablesAdded.set(optionString, variableName);

        return variableName;
    };

    private getOptionString(device: IDeviceToBuild<LightAttributesDto>, lightType: LightTypes): string {
        const option: string[] = [];
        if (device.attributes.max_color_temp_kelvin) {
            option.push(`temperatureMax: ${device.attributes.max_color_temp_kelvin}`);
        }

        if (device.attributes.min_color_temp_kelvin) {
            option.push(`temperatureMin: ${device.attributes.min_color_temp_kelvin}`);
        }

        if (this.isInterfaceWithEffect(lightType)) {
            option.push(`effect: ${this.effectVariableName}`);
        }

        return option.join(", ");
    }

    private getEffectVariableName = (effectList: string[]): string => {
        const getEffectlist = this.getEffectlist(effectList);

        if (this.variablesAdded.has(getEffectlist)) {
            return this.variablesAdded.get(getEffectlist)!;
        }
        this.variableEffetsAddedCpt++;
        const variableName = `LightEffet${this.variableEffetsAddedCpt}`;
        this.variablesAdded.set(getEffectlist, variableName);

        return variableName;
    };

    private getInterfaceToUse = (type: LightTypes): string => {
        if (this.isInterfaceWithEffect(type)) {
            return type + `<typeof ${this.effectVariableName}>`;
        }
        return type;
    };

    private isInterfaceWithEffect = (type: LightTypes): boolean => {
        return type === LightTypes.EFFET || type === LightTypes.TRANSITION_EFFET;
    };

    private getLightType = (supportedColorModes: string[], supportedFeatures: number): LightTypes => {
        if (this.isSupportedColor(supportedColorModes)) {
            if (supportedFeatures & FEATURES_TRANSITION && supportedFeatures & FEATURES_EFFET) {
                return LightTypes.TRANSITION_EFFET;
            }
            if (supportedFeatures & FEATURES_TRANSITION) {
                return LightTypes.TRANSITION;
            }
            if (supportedFeatures & FEATURES_EFFET) {
                return LightTypes.EFFET;
            }
            return LightTypes.COLOR;
        }

        if (this.isSupportedTemperature(supportedColorModes)) {
            return LightTypes.TEMPERATURE;
        }

        if (this.isSupportedBrightness(supportedColorModes)) {
            return LightTypes.BRIGHTNESS;
        }

        return LightTypes.ON_OFF;
    };

    private getEffectlist = (effect: string[]): string => {
        return effect
            .sort()
            .map((v) => `${toUpperCase(v)}: "${v}"`)
            .join(", ");
    };

    private isSupportedColor = (supportedColorModes: string[]): boolean => {
        return supportedColorModes.some((mode) => ["hs", "rgb", "xy", "rgbw", "rgbww"].includes(mode));
    };

    private isSupportedTemperature = (supportedColorModes: string[]): boolean => {
        return supportedColorModes.includes("color_temp");
    };

    private isSupportedBrightness = (supportedColorModes: string[]): boolean => {
        return supportedColorModes.includes("brightness");
    };
}
