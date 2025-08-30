import { ISwitchableEntity, ISwitchableState } from "./switchable.type";
import { IChangedState } from "./entity.type";

export interface ISwitchableSimple extends ISwitchableEntity {
    turnOn(): Promise<boolean>;
    toggle(): Promise<boolean>;

    onStateChange: (change: IChangedState<ISwitchableState>) => void;
    onTurnOn: () => void;
    onTurnOff: () => void;

    removeOnStateChange(callback: (change: IChangedState<ISwitchableState>) => void): void;
}

export interface ISwitch extends ISwitchableSimple {}
