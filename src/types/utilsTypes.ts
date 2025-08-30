import { DEVICE_TYPES } from "src/constants/haFileConstantes";

export type ValuesIn<T> = T extends { [K: string]: infer V } ? V : never;

export type RemoveReadOnly<T> = { -readonly [K in keyof T]: T[K] };

export type OmitMethods<T> = { [K in keyof T as T[K] extends Function ? never : K]: T[K] };

export type TypeIn<T> = T[keyof T];

export type OptionTypes<T> = {
    [K in keyof T]: T[K] extends string | number | number[] | undefined ? T[K] : never;
};

export type DeviceType = (typeof DEVICE_TYPES)[number];

export type DeviceTypeDico<T> = { [key in (typeof DEVICE_TYPES)[number]]: T };
