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
    setDevices(devices: { [ID: string]: IConfigDevice }): Promise<void>;
}
