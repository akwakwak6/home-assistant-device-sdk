import { ISwitchableDevice, SWITCHABLE_STATUS } from "../types/devices/switchable.type.js";
import { IChangedState } from "../types/devices/device.type.js";
import { AbstractDevice } from "./abstractDevice.js";
import { HaWebSocket } from "./haWebSocket.js";

export abstract class SwitchableEntity extends AbstractDevice implements ISwitchableDevice {
    readonly TypeStatus = SWITCHABLE_STATUS;

    private callBackToWrapperMap: Map<(change: any) => void, (change: any) => void> = new Map();

    public turnOn(option?: any): Promise<boolean> {
        const dto = this.mapOptionsToDto(option);
        return HaWebSocket.sendCmd(this.entityType, "turn_on", this.id, dto);
    }

    public turnOff(): Promise<boolean> {
        return HaWebSocket.sendCmd(this.entityType, "turn_off", this.id);
    }

    public toggle(option?: any): Promise<boolean> {
        const dto = this.mapOptionsToDto(option);
        return HaWebSocket.sendCmd(this.entityType, "toggle", this.id, dto);
    }

    public set onTurnOn(callback: () => void) {
        const predicate = (change: IChangedState) =>
            change.newState.status === SWITCHABLE_STATUS.ON && change.oldState.status === SWITCHABLE_STATUS.OFF;
        this.addSpecificStateChangeListener(callback, predicate);
    }

    public set onTurnOff(callback: () => void) {
        const predicate = (change: IChangedState) =>
            change.newState.status === SWITCHABLE_STATUS.OFF && change.oldState.status === SWITCHABLE_STATUS.ON;
        this.addSpecificStateChangeListener(callback, predicate);
    }

    public removeOnTurnOn(callback: () => void): void {
        this.removeTurnCallBack(callback);
    }

    public removeOnTurnOff(callback: () => void): void {
        this.removeTurnCallBack(callback);
    }

    private removeTurnCallBack = (callback: (change: any) => void): void => {
        const wrapper = this.callBackToWrapperMap.get(callback);
        if (wrapper) {
            this.removeOnStateChange(wrapper);
        }
    };

    private addSpecificStateChangeListener(callback: (change: any) => void, predicate: (change: IChangedState) => boolean): void {
        const wrapper = (change: IChangedState) => {
            if (predicate(change)) {
                callback(change);
            }
        };
        this.callBackToWrapperMap.set(callback, wrapper);

        this.addOnStateChangeProtected(wrapper, () => this.removeTurnCallBack(callback));
    }
}
