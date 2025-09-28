import { IChangedState, IDevice, IDeviceState } from "./device.type.js";
import { DEVICE_STATUS } from "./device.type.js";
import { TypeIn } from "../utilsTypes.js";

export const SWITCHABLE_STATUS = {
    ...DEVICE_STATUS,
    ON: "on",
    OFF: "off",
} as const;

export type ISwitchableStatus = TypeIn<typeof SWITCHABLE_STATUS>;

export interface ISwitchableState extends IDeviceState {
    readonly status: ISwitchableStatus;
}

export interface ISwitchableDevice extends IDevice {
    readonly TypeStatus: typeof SWITCHABLE_STATUS;
    readonly state: any;

    turnOn(option?: any): Promise<boolean>;
    turnOff(): Promise<boolean>;
    toggle(option?: any): Promise<boolean>;

    onTurnOn: () => void;
    onTurnOff: () => void;

    removeOnTurnOn(callback: () => void): void;
    removeOnTurnOff(callback: () => void): void;
}
