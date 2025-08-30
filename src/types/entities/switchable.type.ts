import { IChangedState, IEntity, IEntityState } from "./entity.type.js";
import { ENTITY_STATUS } from "./entity.type.js";
import { TypeIn } from "../utilsTypes.js";

export const SWITCHABLE_STATUS = {
    ...ENTITY_STATUS,
    ON: "on",
    OFF: "off",
} as const;

export type ISwitchableStatus = TypeIn<typeof SWITCHABLE_STATUS>;

export interface ISwitchableState extends IEntityState {
    readonly status: ISwitchableStatus;
}

export interface ISwitchableEntity extends IEntity {
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
