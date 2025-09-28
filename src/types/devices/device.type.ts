export const DEVICE_STATUS = {
    UNKNOWN: "unknown",
    UNAVAILABLE: "unavailable",
} as const;

export type IDeviceSession = {
    onEnd: (() => void) | NodeJS.Timeout;
    track(scope: () => void): void;
    startTrack(): void;
    stopTrack(): void;
};

export type IHandler = (session: IDeviceSession) => void | (() => void);

export type IDeviceState = {
    readonly status: any;
    readonly lastChanged?: Date;
    readonly lastReported?: Date;
    readonly lastUpdated?: Date;
};

export interface IChangedState<T extends IDeviceState = IDeviceState> {
    readonly newState: T;
    readonly oldState: T;
}

export type IDevice = {
    readonly TypeStatus: any;
    readonly state: any;
    readonly name: string;
    onStateChange: (change: IChangedState<any>) => void;
    removeOnStateChange(callback: (change: IChangedState<any>) => void): void;
};
