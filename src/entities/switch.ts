import { ISwitchableState, SWITCHABLE_STATUS } from "../types/entities/switchable.type.js";
import { SwitchableEntity } from "./switchableEntity.js";

export class Switch extends SwitchableEntity {
    protected override entityType: string = "switch";
    public override state: ISwitchableState = { status: SWITCHABLE_STATUS.UNKNOWN };
}
