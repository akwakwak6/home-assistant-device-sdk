import { IConfig, IConfigCredentials, IConfigDal, IConfigDeviceType, IConfigDevice } from "src/types/entities/configDal.type";
import { DEFAULT_CONFIG_PATH, ENCODING_FILE } from "src/constants/haFileConstantes";
import * as fs from "fs";

export class ConfigService implements IConfigDal {
    constructor(public readonly configPath: string = DEFAULT_CONFIG_PATH, private config?: Partial<IConfig>) {}

    getAllConfig(): Promise<Partial<IConfig>> {
        if (this.config) {
            return Promise.resolve(this.config as IConfig);
        }
        this.loadConfig();
        if (this.config) {
            return Promise.resolve(this.config as IConfig);
        }
        return Promise.reject(new Error("Config not found"));
    }

    setAllConfig(config: Partial<IConfig>): Promise<void> {
        this.config = config;
        this.saveConfig();
        return Promise.resolve();
    }

    getCredentials(): Promise<IConfigCredentials> {
        return this.getConfigProperty("credentials");
    }

    async setCredentials(credentials: IConfigCredentials): Promise<void> {
        return this.setConfigProperty("credentials", credentials);
    }

    getEntities(): Promise<{ [ID: string]: IConfigDevice }> {
        return this.getConfigProperty("entities");
    }

    async setEntities(entities: { [ID: string]: IConfigDevice }): Promise<void> {
        return this.setConfigProperty("entities", entities);
    }

    getDeviceType(): Promise<IConfigDeviceType> {
        return this.getConfigProperty("deviceType");
    }

    async setDeviceType(deviceType: IConfigDeviceType): Promise<void> {
        return this.setConfigProperty("deviceType", deviceType);
    }

    private getConfigProperty<K extends keyof IConfig>(key: K): Promise<IConfig[K]> {
        if (!this.config?.[key]) {
            this.loadConfig();
        }
        if (this.config?.[key]) {
            return Promise.resolve(this.config[key]!);
        }
        return Promise.reject(new Error("Config not found"));
    }

    private async setConfigProperty<K extends keyof IConfig>(key: K, value: IConfig[K]): Promise<void> {
        this.config = { ...this.config, [key]: value };
        this.saveConfig();
        return Promise.resolve();
    }

    private loadConfig(): void {
        if (fs.existsSync(this.configPath)) {
            this.config = JSON.parse(fs.readFileSync(this.configPath, ENCODING_FILE)) as IConfig;
        }
    }

    private saveConfig(): void {
        fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), ENCODING_FILE);
    }
}
