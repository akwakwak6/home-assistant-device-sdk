import { DeviceTypeDico } from "../utilsTypes";

export interface IConfigEntity {
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
    entities: { [ID: string]: IConfigEntity };
    deviceType: IConfigDeviceType;
}

export interface IConfigDal {
    getAllConfig(): Promise<Partial<IConfig>>;
    setAllConfig(config: Partial<IConfig>): Promise<void>;
    getCredentials(): Promise<IConfigCredentials>;
    setCredentials(credentials: IConfigCredentials): Promise<void>;
    getEntities(): Promise<{ [ID: string]: IConfigEntity }>;
    setEntities(entities: { [ID: string]: IConfigEntity }): Promise<void>;
    getDeviceType(): Promise<IConfigDeviceType>;
    setDeviceType(deviceType: IConfigDeviceType): Promise<void>;
}
