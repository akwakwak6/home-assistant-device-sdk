import { DEFAULT_CONFIG_PATH } from "src/constants/haFileConstantes";
import { CONFIG_MOCK } from "src/mocks/config.mock";
import { IConfig, IConfigDal, IConfigDevice } from "src/types/devices/configDal.type";

export class ConfigServiceMock implements IConfigDal {
    constructor(private readonly configPath: string = DEFAULT_CONFIG_PATH, private config: IConfig = CONFIG_MOCK) {}

    getAllConfig(): Promise<Partial<IConfig>> {
        return Promise.resolve(this.config);
    }

    async setDevices(devices: { [ID: string]: IConfigDevice }): Promise<void> {
        return Promise.resolve();
    }
}
