import { IConfig, IConfigDal, IConfigDevice } from "src/types/devices/configDal.type";
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
        return Promise.resolve({});
    }

    async setDevices(devices: { [ID: string]: IConfigDevice }): Promise<void> {
        this.config = { ...this.config, devices };
        this.saveConfig();
        return Promise.resolve();
    }

    private loadConfig(): void {
        console.log("Load config from");
        if (fs.existsSync(this.configPath)) {
            console.log("file exciste");
            this.config = JSON.parse(fs.readFileSync(this.configPath, ENCODING_FILE)) as IConfig;
            console.log("config loaded", this.config);
        }
    }

    private saveConfig(): void {
        fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), ENCODING_FILE);
    }
}
