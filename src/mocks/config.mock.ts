import { IConfig } from "src/types/entities/configDal.type";

export const CONFIG_MOCK: IConfig = {
    credentials: {
        url: "http://mock-url:8123",
        token: "mock-token",
    },
    devices: {
        "light.wiz_rgbw54554848454": {
            name: "nameFromConfigMock",
            wasDetected: true,
            type: "light",
            isUsed: false,
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
        "switch.notValidName": {
            name: "switch name",
            wasDetected: true,
            type: "light",
        },
    },
    deviceType: {
        switch: false,
    },
} as const;
