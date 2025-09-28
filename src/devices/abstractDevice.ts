import { parseISODateWithMicroseconds } from "src/utils/mappers/date.mapper";
import { IEventMessageDtoIn } from "src/types/dto/in/base.dto.in";
import { IDevice } from "src/types/devices/device.type";
import { HaWebSocket } from "./haWebSocket";

export abstract class AbstractDevice implements IDevice {
    private hasSubscribe: boolean = false;
    private stateChangeCallBaclSet: Set<(change: any) => void> = new Set();
    protected abstract readonly entityType: string;

    abstract readonly TypeStatus: any;
    abstract state: any;

    constructor(public id: string, public name: string) {}

    public set onStateChange(callback: (change: any) => void) {
        this.addOnStateChangeProtected(callback);
    }

    protected addOnStateChangeProtected(callback: (change: any) => void, cleaner?: () => void) {
        const subscription = HaWebSocket.getOnConnectSubscriptionInProgress();
        if (subscription) {
            subscription.addCleaner(() => this.removeOnStateChange(callback));
            subscription.addCleaner(cleaner);
        }
        this.stateChangeCallBaclSet.add(callback);
        this.listenStateChange();
    }

    public removeOnStateChange = (callback: (change: any) => void): void => {
        this.stateChangeCallBaclSet.delete(callback);
        this.unlistenStateChange();
    };

    public setState(state: any): void {
        this.state = this.mapDtoToState(state);
    }

    protected mapOptionsToDto(options?: any): any {
        return options;
    }

    protected mapDtoToState(change: any): any {
        return {
            status: change.state,
            lastChanged: parseISODateWithMicroseconds(change.last_changed),
            lastReported: parseISODateWithMicroseconds(change.last_reported),
            lastUpdated: parseISODateWithMicroseconds(change.last_updated),
        };
    }

    private convertEventFromHaToChangedState(dto: IEventMessageDtoIn): any {
        return {
            newState: this.mapDtoToState(dto.event.variables.trigger.to_state),
            oldState: this.mapDtoToState(dto.event.variables.trigger.from_state),
        };
    }

    private listenStateChange(): Promise<boolean> {
        if (this.hasSubscribe) {
            return Promise.resolve(true);
        }
        this.hasSubscribe = true;
        return HaWebSocket.subscribe(this.id, this.onStateChangeIntern).then((result) => {
            this.hasSubscribe = result;
            return result;
        });
    }

    private unlistenStateChange() {
        if (!this.hasSubscribe) {
            return;
        }
        if (this.stateChangeCallBaclSet.size !== 0) {
            return;
        }
        this.hasSubscribe = false;
        HaWebSocket.unsubscribe(this.id).then((resilt) => {
            this.hasSubscribe = !resilt;
        });
    }

    private onStateChangeIntern = (stateChangeFromHa: any): void => {
        const stateChange = this.convertEventFromHaToChangedState(stateChangeFromHa);

        this.state = stateChange.newState;

        this.stateChangeCallBaclSet.forEach((callback) => {
            callback(stateChange);
        });
    };
}
