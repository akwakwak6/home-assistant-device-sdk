#!/usr/bin/env node
import { ConfigServiceMock } from "src/utils/services/config.service.mock";
import { IAllSateDtoIn, IStateDtoIn } from "src/types/dto/in/base.dto.in";
import { IConfig } from "src/types/entities/configDal.type";
import { buildHaFile } from "../utils/builders/ha.builder";

const CONFIG_MOCK_EMPTY: IConfig = {
    credentials: {
        url: "http://mock-url:8123",
        token: "mock-token",
    },
    devices: {},
    deviceType: {},
};

const CONFIG_MOCK: IConfig = {
    credentials: {
        url: "http://mock-url:8123",
        token: "mock-token",
    },
    devices: {
        "light.wiz_rgbw54554848454": {
            name: "nameFromConfigMock",
            wasDetected: true,
            type: "light",
        },
        "light.idFromConfigMock": {
            name: "AnotherNameFromConfigMock",
            wasDetected: true,
            type: "light",
        },
        "light.notValidName": {
            name: "42not valid@ Na#me",
            wasDetected: true,
            type: "light",
        },
    },
    deviceType: {
        switch: false,
    },
};

const STATES_MOCK: IStateDtoIn<IAllSateDtoIn>[] = [
    {
        entity_id: "switch.switch_office",
        state: "off",
        attributes: {
            friendly_name: "switch office",
        },
        last_changed: "2025-07-20T17:35:31.339506+00:00",
        last_reported: "2025-07-20T17:35:31.339506+00:00",
        last_updated: "2025-07-20T17:35:31.339506+00:00",
    },
    {
        entity_id: "light.light_office",
        state: "off",
        attributes: {
            friendly_name: "light office",
            min_color_temp_kelvin: 2000,
            max_color_temp_kelvin: 6535,
            effect_list: [
                "blink",
                "breathe",
                "candle",
                "channel_change",
                "colorloop",
                "finish_effect",
                "fireplace",
                "okay",
                "stop_effect",
                "stop_hue_effect",
            ],
            supported_color_modes: ["color_temp", "xy"],
            supported_features: 44,
        },
        last_changed: "2025-07-20T19:43:45.787812+00:00",
        last_reported: "2025-07-20T19:43:48.626968+00:00",
        last_updated: "2025-07-20T19:43:48.626968+00:00",
    },
    {
        entity_id: "light.544651954664",
        state: "off",
        attributes: {
            min_color_temp_kelvin: 2200,
            max_color_temp_kelvin: 6500,
            effect_list: [
                "Alarm",
                "Bedtime",
                "Candlelight",
                "Christmas",
                "Cozy",
                "Cool white",
                "Daylight",
                "Diwali",
                "Deep dive",
                "Fall",
                "Fireplace",
                "Forest",
                "Focus",
                "Golden white",
                "Halloween",
                "Jungle",
                "Mojito",
                "Night light",
                "Ocean",
                "Party",
                "Pulse",
                "Pastel colors",
                "Plantgrowth",
                "Romance",
                "Relax",
                "Sunset",
                "Spring",
                "Summer",
                "Steampunk",
                "True colors",
                "TV time",
                "White",
                "Wake-up",
                "Warm white",
                "Rhythm",
            ],
            supported_color_modes: ["color_temp", "rgbw"],
            friendly_name: "lightBateau",
            supported_features: 4,
        },
        last_changed: "2025-07-20T18:53:31.251179+00:00",
        last_reported: "2025-07-20T19:28:50.523870+00:00",
        last_updated: "2025-07-20T18:53:31.251179+00:00",
    },
    {
        entity_id: "light.wiz_rgbw_tunable_d3e436",
        state: "off",
        attributes: {
            min_color_temp_kelvin: 2200,
            max_color_temp_kelvin: 6500,
            supported_color_modes: ["color_temp"],
            friendly_name: "lightBedroom",
            supported_features: 0,
        },
        last_changed: "2025-07-20T18:53:31.251179+00:00",
        last_reported: "2025-07-20T19:28:50.523870+00:00",
        last_updated: "2025-07-20T18:53:31.251179+00:00",
    },
    {
        entity_id: "light.wiz_rgbw_75478498987",
        state: "off",
        attributes: {
            supported_color_modes: ["on_off"],
            friendly_name: "lightKitchen",
            supported_features: 0,
        },
        last_changed: "2025-07-20T18:53:31.251179+00:00",
        last_reported: "2025-07-20T19:28:50.523870+00:00",
        last_updated: "2025-07-20T18:53:31.251179+00:00",
    },
    {
        entity_id: "light.wiz_rgbw54554848454",
        state: "off",
        attributes: {
            supported_color_modes: ["on_off"],
            friendly_name: "lightKitchen",
            supported_features: 0,
        },
        last_changed: "2025-07-20T18:53:31.251179+00:00",
        last_reported: "2025-07-20T19:28:50.523870+00:00",
        last_updated: "2025-07-20T18:53:31.251179+00:00",
    },
    {
        entity_id: "light.idFromConfigMock",
        state: "off",
        attributes: {
            supported_color_modes: ["on_off"],
            friendly_name: "already in co'nfig",
            supported_features: 0,
        },
        last_changed: "2025-07-20T18:53:31.251179+00:00",
        last_reported: "2025-07-20T19:28:50.523870+00:00",
        last_updated: "2025-07-20T18:53:31.251179+00:00",
    },
    {
        entity_id: "light.notValidName",
        state: "off",
        attributes: {
            supported_color_modes: ["on_off"],
            friendly_name: "already in co'nfig",
            supported_features: 0,
        },
        last_changed: "2025-07-20T18:53:31.251179+00:00",
        last_reported: "2025-07-20T19:28:50.523870+00:00",
        last_updated: "2025-07-20T18:53:31.251179+00:00",
    },
];

buildHaFile(
    {
        configDal: new ConfigServiceMock("", CONFIG_MOCK_EMPTY),
        // configPath: "./local/configMock.json",
        out: "./local/haBuildFromStatesMock.ts",
        url: "http://mock-url:8123",
        token: "mock-token",
    },
    STATES_MOCK
);
