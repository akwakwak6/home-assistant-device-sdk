import { ISwitchableDevice, ISwitchableState } from "./switchable.type";
import { IChangedState } from "./device.type";

export interface ISwitchableSimple extends ISwitchableDevice {
    turnOn(): Promise<boolean>;
    toggle(): Promise<boolean>;

    onStateChange: (change: IChangedState<ISwitchableState>) => void;
    onTurnOn: () => void;
    onTurnOff: () => void;

    removeOnStateChange(callback: (change: IChangedState<ISwitchableState>) => void): void;
}

export interface ISwitch extends ISwitchableSimple {}
