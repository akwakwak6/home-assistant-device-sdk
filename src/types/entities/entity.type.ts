export const ENTITY_STATUS = {
    UNKNOWN: "unknown",
    UNAVAILABLE: "unavailable",
} as const;

export type IEntitySession = {
    onEnd: (() => void) | NodeJS.Timeout;
    track(scope: () => void): void;
    startTrack(): void;
    stopTrack(): void;
};

export type IHandler = (session: IEntitySession) => void | (() => void);

export type IEntityState = {
    readonly status: any;
    readonly lastChanged?: Date;
    readonly lastReported?: Date;
    readonly lastUpdated?: Date;
};

export interface IChangedState<T extends IEntityState = IEntityState> {
    readonly newState: T;
    readonly oldState: T;
}

export type IEntity = {
    readonly TypeStatus: any;
    readonly state: any;
    readonly name: string;
    onStateChange: (change: IChangedState<any>) => void;
    removeOnStateChange(callback: (change: IChangedState<any>) => void): void;
};
