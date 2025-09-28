import { ISwitchableDevice, ISwitchableState } from "./switchable.type";
import { ISwitchableSimple } from "./switch.type";
import { IChangedState } from "./device.type";
import { ColorNameEnum } from "../colorName.enum";
import { ValuesIn } from "../utilsTypes";

export interface ILight extends ISwitchableSimple {}

/**
 *  Brightness
 */
export interface ILightBrightnessFeature {
    brightness?: number;
}

export type ILightBrightnessState = ISwitchableState & ILightBrightnessFeature;

export interface ILightBrightness extends ISwitchableDevice {
    readonly state: ILightBrightnessState;
    brightness?: number;

    turnOn(option?: ILightBrightnessFeature): Promise<boolean>;
    toggle(option?: ILightBrightnessFeature): Promise<boolean>;

    onStateChange: (change: IChangedState<ILightBrightnessState>) => void;

    removeOnStateChange(callback: (change: IChangedState<ILightBrightnessState>) => void): void;
}

/**
 *  Temperature
 */
export interface ILightTemperatureFeature extends ILightBrightnessFeature {
    colorTemperature?: number;
}

export type ILightTemperatureState = ISwitchableState & ILightTemperatureFeature;

export interface ILightTemperatureBase extends ISwitchableDevice {
    readonly temperatureMax: number;
    readonly temperatureMin: number;
    brightness?: number;
    colorTemperature?: number;
}

export interface ILightTemperature extends ILightTemperatureBase {
    readonly state: ILightTemperatureState;

    turnOn(option?: ILightTemperatureFeature): Promise<boolean>;
    toggle(option?: ILightTemperatureFeature): Promise<boolean>;

    onStateChange: (change: IChangedState<ILightTemperatureState>) => void;

    removeOnStateChange(callback: (change: IChangedState<ILightTemperatureState>) => void): void;
}

/**
 * Color
 */
export type ColorRGB = { r: number; g: number; b: number };

export interface ILightColorFeature extends ILightTemperatureFeature {
    colorRGB?: ColorRGB;
    colorName?: ColorNameEnum;
}

export type ILightColorState = ISwitchableState & ILightColorFeature;

export interface ILightColorBase extends ILightTemperatureBase {
    readonly TypeColorName: typeof ColorNameEnum;
    readonly state: ILightColorState;
    colorRGB?: ColorRGB;
    colorName?: ColorNameEnum;

    onStateChange: (change: IChangedState<ILightColorState>) => void;
    removeOnStateChange(callback: (change: IChangedState<ILightColorState>) => void): void;
}

export interface ILightColor extends ILightColorBase {
    turnOn(option?: ILightColorFeature): Promise<boolean>;
    toggle(option?: ILightColorFeature): Promise<boolean>;
}

/**
 * Transition
 */
export interface ILightTransitionFeature extends ILightColorFeature {
    transition?: number;
}

export interface IlightTransition extends ILightColorBase {
    transition?: number;
    turnOn(option?: ILightTransitionFeature): Promise<boolean>;
    toggle(option?: ILightTransitionFeature): Promise<boolean>;
}

/**
 * Effects
 */
export interface ILightEffectFeature<EFFETS> extends ILightColorFeature {
    colorEffect?: ValuesIn<EFFETS>;
}

export interface IlightEffect<EFFETS> extends ILightColorBase {
    readonly TypeEffets: EFFETS;
    colorEffect?: ValuesIn<EFFETS>;
    turnOn(option?: ILightEffectFeature<EFFETS>): Promise<boolean>;
    toggle(option?: ILightEffectFeature<EFFETS>): Promise<boolean>;
}

/**
 * Transition and Effects
 */
export type ILightTransitionEffectFeature<EFFETS> = ILightTransitionFeature & ILightEffectFeature<EFFETS>;

export interface IlightTransitionEffect<EFFETS> extends ILightColorBase {
    readonly TypeEffets: EFFETS;
    effect?: ValuesIn<EFFETS>;
    transition?: number;
    turnOn(option?: ILightTransitionEffectFeature<EFFETS>): Promise<boolean>;
    toggle(option?: ILightTransitionEffectFeature<EFFETS>): Promise<boolean>;
}
