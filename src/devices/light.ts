import { SwitchableEntity } from "./switchableEntity";
import { ColorNameEnum } from "src/types/colorName.enum";
import { ValuesIn } from "src/types/utilsTypes";
import { SWITCHABLE_STATUS } from "src/types/devices/switchable.type";
import { LightOptionDtoOut } from "src/types/dto/out/light.dto.out";
import { IStateDtoIn } from "src/types/dto/in/base.dto.in";
import { LightAttributesDto } from "src/types/dto/in/light.dto.in";
import { IlightTransitionEffect, ILightColorState, ColorRGB, ILightTransitionEffectFeature, ILightEffectFeature } from "src/types/devices/light.type";

export interface IBuildOptionLight<EFFETS = {}> {
    temperatureMax?: number;
    temperatureMin?: number;
    effect?: EFFETS;
}

export class Light<EFFETS = {}> extends SwitchableEntity implements IlightTransitionEffect<EFFETS> {
    protected override entityType: string = "light";

    public readonly TypeEffets: EFFETS;
    public readonly TypeColorName = ColorNameEnum;
    public readonly temperatureMax: number;
    public readonly temperatureMin: number;

    public override state: ILightColorState = { status: SWITCHABLE_STATUS.UNKNOWN };

    public brightness?: number;
    public colorTemperature?: number;
    public colorEffect?: ValuesIn<EFFETS>;
    public transition?: number;
    public colorRGB?: ColorRGB;
    public colorName?: ColorNameEnum;

    constructor(id: string, name: string, option?: IBuildOptionLight<EFFETS>) {
        super(id, name);
        this.temperatureMax = option?.temperatureMax || NaN;
        this.temperatureMin = option?.temperatureMin || NaN;
        this.TypeEffets = option?.effect || ({} as EFFETS);
    }

    protected override mapOptionsToDto(options?: ILightTransitionEffectFeature<EFFETS>): LightOptionDtoOut {
        const dto: LightOptionDtoOut = {};

        const brightness = options?.brightness ?? this.brightness;
        const transition = options?.transition ?? this.transition;

        brightness && (dto.brightness = brightness);
        transition && (dto.transition = transition);

        if (this.hasColorOption(options)) {
            options?.colorName && (dto.color_name = options.colorName);
            options?.colorRGB && (dto.rgb_color = this.mapColorOptionToDto(options.colorRGB));
            options?.colorTemperature && (dto.color_temp_kelvin = options.colorTemperature);
            options?.colorEffect && (dto.effect = options.colorEffect as string);
            return dto;
        }
        this.colorName && (dto.color_name = this.colorName);
        this.colorRGB && (dto.rgb_color = this.mapColorOptionToDto(this.colorRGB));
        this.colorTemperature && (dto.color_temp_kelvin = this.colorTemperature);
        this.colorEffect && (dto.effect = this.colorEffect as string);
        return dto;
    }

    protected override mapDtoToState(dto: IStateDtoIn<LightAttributesDto>): ILightColorState {
        const state: ILightColorState = super.mapDtoToState(dto);

        state.brightness = dto.attributes.brightness;
        state.colorRGB = this.mapColorDtoToState(dto.attributes.rgb_color);
        state.colorTemperature = dto.attributes.color_temp_kelvin;

        return state;
    }

    private hasColorOption(option?: ILightEffectFeature<EFFETS>): boolean {
        return !!(option && (option.colorName || option.colorRGB || option.colorEffect || option.colorTemperature));
    }

    private mapColorOptionToDto(colorRgb: ColorRGB): [number, number, number] {
        return [colorRgb.r, colorRgb.g, colorRgb.b];
    }

    private mapColorDtoToState(colorRgb?: [number, number, number]): ColorRGB | undefined {
        if (!colorRgb) {
            return undefined;
        }
        return { r: colorRgb[0], g: colorRgb[1], b: colorRgb[2] };
    }
}
