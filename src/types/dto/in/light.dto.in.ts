export interface LightAttributesDto {
    effect_list: string[];
    brightness?: number;
    color_temp_kelvin?: number;
    min_color_temp_kelvin?: number;
    max_color_temp_kelvin?: number;
    rgb_color?: [number, number, number];
    effect?: string;
    friendly_name: string;
    supported_features: number;
    supported_color_modes: string[];
    color_mode?: string;
}
