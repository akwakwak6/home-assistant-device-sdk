import { IDeviceToBuild } from "src/types/devices/deviceBuilder.type";
import { toPascalCase } from "../mappers/string.mapper";

export class DeviceBuilder {
    protected deviceType!: string;
    protected className!: string;
    protected deviceId!: string;
    protected uniqueName!: string;

    public buildDevice(deviceToBuild: IDeviceToBuild): void {
        this.className = toPascalCase(deviceToBuild.type);
        this.uniqueName = deviceToBuild.name;
        this.deviceId = deviceToBuild.id;
        this.deviceType = deviceToBuild.type;
    }

    public getNewInstanceLine(): string {
        return `new ${this.className}("${this.deviceId}", "${this.uniqueName}") as I${this.className}`;
    }

    public getImportsLine(): string {
        return `import { ${this.className}, I${this.className} } from "home-assistant-device-sdk";`;
    }

    public getVariableToAddLine(): string[] {
        return [];
    }

    public getDeviceTypes(): string[] {
        return [this.deviceType];
    }
}
