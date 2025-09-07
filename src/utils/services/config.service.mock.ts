import { DEFAULT_CONFIG_PATH } from "src/constants/haFileConstantes";
import { CONFIG_MOCK } from "src/mocks/config.mock";
import { IConfig, IConfigCredentials, IConfigDal, IConfigDeviceType, IConfigDevice } from "src/types/entities/configDal.type";

export class ConfigServiceMock implements IConfigDal {
    constructor(private readonly configPath: string = DEFAULT_CONFIG_PATH, private config: IConfig = CONFIG_MOCK) {}

    getAllConfig(): Promise<Partial<IConfig>> {
        return Promise.resolve(this.config);
    }

    setAllConfig(config: Partial<IConfig>): Promise<void> {
        return Promise.resolve();
    }

    getCredentials(): Promise<IConfigCredentials> {
        return Promise.resolve(this.config.credentials);
    }

    async setCredentials(credentials: IConfigCredentials): Promise<void> {
        return Promise.resolve();
    }

    getEntities(): Promise<{ [ID: string]: IConfigDevice }> {
        return Promise.resolve(this.config.devices);
    }

    async setEntities(entities: { [ID: string]: IConfigDevice }): Promise<void> {
        return Promise.resolve();
    }

    getDeviceType(): Promise<IConfigDeviceType> {
        return Promise.resolve(this.config.deviceType);
    }

    async setDeviceType(deviceType: IConfigDeviceType): Promise<void> {
        return Promise.resolve();
    }
}
