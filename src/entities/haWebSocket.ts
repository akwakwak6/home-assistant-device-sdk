import { IStateDtoIn, IMessageDtoIn, IMessageDtoFromDtoMessageType, DtoMessageType } from "src/types/dto/in/base.dto.in";
import { IEntitySession, IHandler } from "src/types/entities/entity.type";
import { ConfigService } from "src/utils/services/config.service";
import { MessageOutType } from "src/types/dto/out/base.dto.out";
import { IConfigDal } from "src/types/entities/configDal.type";
import { AbstractEntity } from "./abstractEntity";

const CONNECT_RETRY_DELAY = 5000;
const HEARTBEAT_INTERVAL = 2000;
const HEARTBEAT_TIMEOUT = 5000;

type CallBack = (x?: unknown) => void;

class Session implements IEntitySession {
    private cleaners: (() => void)[] = [];

    constructor(private readonly subscription: OnConnectSubscription) {}

    public set onEnd(value: () => void | NodeJS.Timeout) {
        this.addOnEnd(value);
    }

    public addOnEnd = (value: () => void | NodeJS.Timeout) => {
        if (typeof value === "function") {
            this.cleaners.push(value);
            return;
        }
        this.cleaners.push(() => clearInterval(value));
    };

    public track(scope: () => void) {
        this.startTrack();
        scope();
        this.stopTrack();
    }

    public startTrack() {
        HaWebSocket.addSubscriptionInProgress(this.subscription);
    }

    public stopTrack() {
        HaWebSocket.removeSubscriptionInProgress();
    }

    public clean() {
        this.cleaners.reverse().forEach((cleaner) => cleaner());
        this.cleaners = [];
    }
}

class OnConnectSubscription {
    private session = new Session(this);

    constructor(private handler: IHandler) {}

    public execute() {
        this.session.clean();
        const cleanUp = this.handler(this.session);
        if (cleanUp) {
            this.session.addOnEnd(cleanUp);
        }
    }

    public addCleaner(cleaner?: () => void) {
        if (cleaner) {
            this.session.addOnEnd(cleaner);
        }
    }

    public clean() {
        this.session.clean();
    }
}

export interface IConnectionConfig {
    url?: string;
    token?: string;
    configDal?: IConfigDal;
    configPath?: string;
}

export class HaWebSocket {
    private static socket: WebSocket;
    private static isAuthenticated: boolean = false;
    private static connectRetryTimer?: NodeJS.Timeout;
    private static heartbeatTimer?: NodeJS.Timeout;
    private static heartbeatTimeOutTimer?: NodeJS.Timeout;
    private static onConnectSubscriptionMap: Map<IHandler, OnConnectSubscription> = new Map();
    private static onConnectSubscriptionsInProgress: OnConnectSubscription[] = [];
    private static haIdEntityDico: Record<string, AbstractEntity> = {};
    private static callBackResultDico: Record<number, CallBack | undefined> = {};
    private static entitySubscriptionDico: Record<string, number> = {};

    private static idIdentifie = 0;
    private static _url: string;
    private static token: string;
    private static callBackDico: Record<number, CallBack | undefined> = {};

    private static set url(url: string) {
        const protocole = url.startsWith("https://") ? "wss://" : "ws://";
        const hostPort = url.replace("https://", "").replace("http://", "");
        this._url = `${protocole}${hostPort}/api/websocket`;
    }
    private static get url(): string {
        return this._url;
    }

    public static async connect(ha: any, config?: IConnectionConfig): Promise<void> {
        if (this.isAuthenticated) {
            return Promise.resolve();
        }

        await this.getCredentials(config);

        const promess = new Promise<void>((resolve) => {
            this.callBackDico[0] = resolve as CallBack;
            this.startConnect();
        });

        if (Object.keys(this.haIdEntityDico).length === 0) {
            Object.values(ha).forEach((entity: any) => {
                if (entity?.id) {
                    this.haIdEntityDico[entity?.id] = entity as AbstractEntity;
                }
            });
        }

        return promess;
    }

    static async refreshStates(): Promise<boolean> {
        const callBack = (states: IStateDtoIn[]) => {
            states.forEach((state) => {
                this.haIdEntityDico[state.entity_id]?.setState(state);
            });
        };
        return this.sendCmdToHa({ type: MessageOutType.GetParamss }, callBack as CallBack);
    }

    public static onConnect(callBack: IHandler) {
        this.onConnectSubscriptionMap.get(callBack)?.clean();

        const subscription = new OnConnectSubscription(callBack);

        if (this.isAuthenticated) {
            this.executeOnConnectSubscriptions(subscription);
        }

        this.onConnectSubscriptionMap.set(callBack, subscription);
    }

    static removeOnConnect(callBack: IHandler) {
        this.onConnectSubscriptionMap.get(callBack)?.clean();
        this.onConnectSubscriptionMap.delete(callBack);
    }

    public static sendCmd(domain: string, service: string, entityId: string, options?: any, callBack?: CallBack): Promise<boolean> {
        const body = {
            type: MessageOutType.CallService,
            domain,
            service,
            service_data: {
                entity_id: entityId,
                ...options,
            },
        };

        return HaWebSocket.sendCmdToHa(body, callBack);
    }

    public static subscribe(entityId: string, callBack: CallBack): Promise<boolean> {
        const body = {
            type: MessageOutType.SubscribeTrigger,
            trigger: {
                platform: "state",
                entity_id: entityId,
            },
        };
        return HaWebSocket.sendCmdToHa(body, callBack, entityId);
    }

    public static unsubscribe(entityId: string): Promise<boolean> {
        if (!this.entitySubscriptionDico[entityId]) {
            console.warn("No subscription found for entity", entityId);
            return Promise.resolve(false);
        }

        const body = {
            type: MessageOutType.UnsubscribeEvents,
            subscription: this.entitySubscriptionDico[entityId],
        };
        return HaWebSocket.sendCmdToHa(body);
    }

    private static sendCmdToHa(body: Record<string, unknown>, callBack?: CallBack, subEntityId?: string): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            if (!this.isAuthenticated) {
                resolve(false);
            }

            const id = ++this.idIdentifie;
            this.socket.send(
                JSON.stringify({
                    id,
                    ...body,
                })
            );

            const onResult = (result: boolean) => {
                callBack && (this.callBackDico[id] = callBack as CallBack);
                subEntityId && (this.entitySubscriptionDico[subEntityId] = id);
                resolve(result);
            };

            this.callBackResultDico[id] = onResult as CallBack;
        });
    }

    private static listenMessage() {
        this.socket.addEventListener("open", () => {
            console.log("open ws with home assistant");
            if (this.connectRetryTimer) {
                clearInterval(this.connectRetryTimer);
                this.connectRetryTimer = undefined;
            }
        });

        this.socket.addEventListener("message", (msg: MessageEvent) => {
            this.manageMessageIn(JSON.parse(msg.data) as IMessageDtoIn);
        });

        this.socket.addEventListener("close", () => {
            this.onConnectSubscriptionMap.forEach((sub) => sub.clean());
            console.warn("WebSocket connection closed.");
            this.isAuthenticated = false;
            this.callBackDico = {};
            this.idIdentifie = 0;
            if (this.heartbeatTimer) {
                clearInterval(this.heartbeatTimer);
                this.heartbeatTimer = undefined;
            }
            if (this.heartbeatTimeOutTimer) {
                clearTimeout(this.heartbeatTimeOutTimer);
                this.heartbeatTimeOutTimer = undefined;
            }
            this.startConnect();
        });

        this.socket.addEventListener("error", (error) => {
            console.error("WebSocket error :", error.toString());
        });
    }

    private static startHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            HaWebSocket.sendCmdToHa({ type: MessageOutType.Ping });
            if (!this.heartbeatTimeOutTimer) {
                this.heartbeatTimeOutTimer = setTimeout(this.onPingTooSlow, HEARTBEAT_TIMEOUT);
            }
        }, HEARTBEAT_INTERVAL);
    }

    private static manageMessageIn = (msg: IMessageDtoFromDtoMessageType) => {
        if (msg.type === DtoMessageType.Pong) {
            this.resetHeartbeatTimeout();
            return;
        }

        if (msg.type === DtoMessageType.Event) {
            this.callBackDico[msg.id]?.(msg);
            return;
        }

        if (msg.type === DtoMessageType.Result) {
            this.callBackDico[msg.id]?.(msg.result);
            this.callBackResultDico[msg.id]?.(msg.success);
            return;
        }

        if (msg.type === DtoMessageType.AuthOk) {
            console.log("Connected to Home Assistant");
            this.isAuthenticated = true;
            this.callBackDico[0]?.();
            this.onConnectSubscriptionMap.forEach(this.executeOnConnectSubscriptions);
            this.startHeartbeat();
            return;
        }

        if (msg.type === DtoMessageType.AuthRequired) {
            this.socket.send(JSON.stringify({ type: MessageOutType.Auth, access_token: this.token }));
            return;
        }

        if (msg.type === DtoMessageType.AuthInvalid) {
            console.error("Authentication failed. Invalid access token.", msg.message);
            process.exit(1);
        }

        console.warn("Unknown message type:", msg);
    };

    private static resetHeartbeatTimeout = () => {
        if (this.heartbeatTimeOutTimer) {
            clearTimeout(this.heartbeatTimeOutTimer);
            this.heartbeatTimeOutTimer = undefined;
        }
    };

    private static onPingTooSlow = () => {
        console.warn("Heartbeat timeout");
        this.resetHeartbeatTimeout();
    };

    private static startConnect() {
        this.socket = new WebSocket(this.url);
        this.listenMessage();
        this.startTryConnect();
    }

    public static addSubscriptionInProgress(subscription: OnConnectSubscription) {
        this.onConnectSubscriptionsInProgress.push(subscription);
    }

    public static removeSubscriptionInProgress() {
        this.onConnectSubscriptionsInProgress.pop();
    }

    public static getOnConnectSubscriptionInProgress(): OnConnectSubscription | null {
        if (this.onConnectSubscriptionsInProgress.length === 0) {
            return null;
        }
        return this.onConnectSubscriptionsInProgress[this.onConnectSubscriptionsInProgress.length - 1];
    }

    private static executeOnConnectSubscriptions = (subscription: OnConnectSubscription) => {
        this.onConnectSubscriptionsInProgress.push(subscription);
        subscription.execute();
        this.onConnectSubscriptionsInProgress.pop();
    };

    private static startTryConnect() {
        if (this.connectRetryTimer) {
            return;
        }
        this.connectRetryTimer = setInterval(() => {
            this.socket.close();
            this.startConnect();
        }, CONNECT_RETRY_DELAY);
    }

    private static async getCredentials(config?: IConnectionConfig) {
        if (config?.url && config?.token) {
            this.url = config.url;
            this.token = config.token;
            return;
        }

        if (process.env.HA_URL && process.env.HA_TOKEN) {
            this.url = process.env.HA_URL;
            this.token = process.env.HA_TOKEN;
            return;
        }

        if (config?.configDal) {
            try {
                const credentials = (await config.configDal.getAllConfig()).credentials;
                if (!credentials?.url || !credentials.token) {
                    throw new Error("Missing credentials in configDal");
                }
                this.url = credentials.url;
                this.token = credentials.token;
                return;
            } catch (error) {
                console.warn("Failed to get credentials :", error);
            }
        }

        try {
            const defaultConfigService = new ConfigService(config?.configPath);
            const credentials = (await defaultConfigService.getAllConfig()).credentials;
            if (!credentials?.url || !credentials.token) {
                throw new Error("Missing credentials");
            }
            this.url = credentials.url;
            this.token = credentials.token;
        } catch (error) {
            throw new Error("Missing credentials");
        }
    }
}
