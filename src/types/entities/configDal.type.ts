import { DeviceTypeDico } from "../utilsTypes";

export interface IConfigDevice {
    wasDetected: boolean;
    type: string;
    name: string;
    isUsed?: boolean;
}

export interface IConfigCredentials {
    url: string;
    token: string;
}

export type IConfigDeviceType = Partial<DeviceTypeDico<boolean>>;

export interface IConfig {
    credentials: IConfigCredentials;
    devices: { [ID: string]: IConfigDevice };
    deviceType: IConfigDeviceType;
}

export interface IConfigDal {
    getAllConfig(): Promise<Partial<IConfig>>;
    setAllConfig(config: Partial<IConfig>): Promise<void>;
    getCredentials(): Promise<IConfigCredentials>;
    setCredentials(credentials: IConfigCredentials): Promise<void>;
    getEntities(): Promise<{ [ID: string]: IConfigDevice }>;
    setEntities(entities: { [ID: string]: IConfigDevice }): Promise<void>;
    getDeviceType(): Promise<IConfigDeviceType>;
    setDeviceType(deviceType: IConfigDeviceType): Promise<void>;
}
