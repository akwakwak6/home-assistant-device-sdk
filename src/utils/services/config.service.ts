import { IConfig, IConfigDal, IConfigDevice } from "src/types/entities/configDal.type";
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

    async setDevices(devices: { [ID: string]: IConfigDevice }): Promise<void> {
        this.config = { ...this.config, devices };
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
