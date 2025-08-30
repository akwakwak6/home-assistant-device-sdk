import { LightAttributesDto } from "./light.dto.in";

export enum DtoMessageType {
    AuthRequired = "auth_required",
    AuthOk = "auth_ok",
    AuthInvalid = "auth_invalid",
    Result = "result",
    Event = "event",
    Pong = "pong",
}

export interface IAuthRequiredMessageDtoIn {
    type: DtoMessageType.AuthRequired;
    ha_version: string;
}

export interface IAuthOkMessageDtoIn {
    type: DtoMessageType.AuthOk;
    ha_version: string;
}

export interface IAuthInvalidMessageDtoIn {
    type: DtoMessageType.AuthInvalid;
    message: string;
}

export interface IPongMessageDtoIn {
    id: number;
    type: DtoMessageType.Pong;
}

export interface IAttributeDtoInBase {
    friendly_name: string;
}

export interface IResultMessageDtoIn<T extends IAttributeDtoInBase = IAttributeDtoInBase> {
    id: number;
    type: DtoMessageType.Result;
    success: boolean;
    result?: IStateDtoIn<T>[];
}

export type IAllSateDtoIn = IAttributeDtoInBase | LightAttributesDto;

export interface IStateDtoIn<T = IAttributeDtoInBase> {
    entity_id: string;
    state: string;
    attributes: T;
    last_changed: string;
    last_reported: string;
    last_updated: string;
}

export interface IEventMessageDtoIn<T extends IAttributeDtoInBase = IAttributeDtoInBase> {
    id: number;
    type: DtoMessageType.Event;
    event: {
        variables: {
            trigger: {
                id: number;
                idx: number;
                alias: unknown;
                platform: "state";
                entity_id: string;
                from_state: IStateDtoIn<T>;
                to_state: IStateDtoIn<T>;
            };
            for: unknown;
            attribute: unknown;
            description: string;
        };
        context: {
            id: string;
            parent_id: string;
            user_id: string;
        };
    };
}

export interface IChangedStateDtoIn<T extends IAttributeDtoInBase = IAttributeDtoInBase> {
    newState: IStateDtoIn<T>;
    oldState: IStateDtoIn<T>;
}

export type IMessageDtoIn =
    | IResultMessageDtoIn
    | IEventMessageDtoIn
    | IAuthRequiredMessageDtoIn
    | IAuthOkMessageDtoIn
    | IAuthInvalidMessageDtoIn;

// prettier-ignore
export type IMessageDtoFromDtoMessageType<T extends DtoMessageType = DtoMessageType> =
      T extends DtoMessageType.AuthRequired ? IAuthRequiredMessageDtoIn
    : T extends DtoMessageType.AuthOk ? IAuthOkMessageDtoIn
    : T extends DtoMessageType.AuthInvalid ? IAuthInvalidMessageDtoIn
    : T extends DtoMessageType.Result ? IResultMessageDtoIn
    : T extends DtoMessageType.Event ? IEventMessageDtoIn
    : T extends DtoMessageType.Pong ? IPongMessageDtoIn
    : never;
