import { ISwitchableState, SWITCHABLE_STATUS } from "../types/devices/switchable.type.js";
import { SwitchableEntity } from "./switchableEntity.js";

export class Switch extends SwitchableEntity {
    protected override entityType: string = "switch";
    public override state: ISwitchableState = { status: SWITCHABLE_STATUS.UNKNOWN };
}
