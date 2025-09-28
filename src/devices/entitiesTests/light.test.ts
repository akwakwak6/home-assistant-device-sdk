import { describe, vi, it, expect, beforeEach } from "vitest";
import { Light } from "../light";
import { HaWebSocket } from "../haWebSocket";

const createMockState = (state: string, attributes: Record<string, any> = {}) => ({
    state,
    attributes,
    last_changed: new Date().toISOString(),
    last_reported: new Date().toISOString(),
    last_updated: new Date().toISOString(),
});

const createMockEvent = (toState: string, fromState: string, toAttributes: Record<string, any> = {}, fromAttributes: Record<string, any> = {}) => ({
    event: {
        variables: {
            trigger: {
                to_state: createMockState(toState, toAttributes),
                from_state: createMockState(fromState, fromAttributes),
            },
        },
    },
});

const createTurnOnEvent = (attributes: Record<string, any> = {}) => createMockEvent("on", "off", attributes);

const createTurnOffEvent = (attributes: Record<string, any> = {}) => createMockEvent("off", "on", attributes);

const createBrightnessChangeEvent = (fromBrightness: number, toBrightness: number) =>
    createMockEvent("on", "on", { brightness: toBrightness }, { brightness: fromBrightness });

const createStateChangeEvent = (
    fromState: string,
    toState: string,
    fromAttributes: Record<string, any> = {},
    toAttributes: Record<string, any> = {}
) => createMockEvent(toState, fromState, toAttributes, fromAttributes);

vi.mock("../haWebSocket", () => ({
    HaWebSocket: {
        sendCmd: vi.fn().mockResolvedValue(true),
        subscribe: vi.fn().mockResolvedValue(true),
        unsubscribe: vi.fn().mockResolvedValue(true),
        getOnConnectSubscriptionInProgress: vi.fn().mockReturnValue(null),
    },
}));

describe("Light", () => {
    let light: Light;

    beforeEach(() => {
        vi.clearAllMocks();
        light = new Light("test-id", "test-light");
    });

    it("should send turn_on command to HaWebSocket", async () => {
        light.brightness = 128;
        await light.turnOn();

        expect(HaWebSocket.sendCmd).toHaveBeenCalledWith("light", "turn_on", "test-id", { brightness: 128 });
    });

    it("should send turn_off command to HaWebSocket", async () => {
        await light.turnOff();

        expect(HaWebSocket.sendCmd).toHaveBeenCalledWith("light", "turn_off", "test-id");
    });

    it("should send turn_on command with brightness option", async () => {
        await light.turnOn({ brightness: 128 });

        expect(HaWebSocket.sendCmd).toHaveBeenCalledWith("light", "turn_on", "test-id", { brightness: 128 });
    });

    it("should send turn_on command with all options", async () => {
        await light.turnOn({
            brightness: 200,
            transition: 5,
            colorTemperature: 3000,
            colorRGB: { r: 255, g: 128, b: 0 },
            colorName: "red",
            colorEffect: "rainbow",
        });

        expect(HaWebSocket.sendCmd).toHaveBeenCalledWith("light", "turn_on", "test-id", {
            brightness: 200,
            transition: 5,
            color_temp_kelvin: 3000,
            rgb_color: [255, 128, 0],
            color_name: "red",
            effect: "rainbow",
        });
    });

    it("should prioritize options over instance properties", async () => {
        light.brightness = 100;
        light.transition = 2;
        light.colorTemperature = 2700;
        light.colorRGB = { r: 0, g: 255, b: 0 };
        light.colorName = "blue";
        light.colorEffect = "strobe";

        await light.turnOn({
            brightness: 255,
            transition: 10,
            colorTemperature: 4000,
            colorRGB: { r: 255, g: 0, b: 255 },
            colorName: "purple",
            colorEffect: "fade",
        });

        expect(HaWebSocket.sendCmd).toHaveBeenCalledWith("light", "turn_on", "test-id", {
            brightness: 255,
            transition: 10,
            color_temp_kelvin: 4000,
            rgb_color: [255, 0, 255],
            color_name: "purple",
            effect: "fade",
        });
    });

    it("should use instance properties when no options provided", async () => {
        light.brightness = 150;
        light.transition = 3;
        light.colorTemperature = 3500;
        light.colorRGB = { r: 128, g: 64, b: 192 };
        light.colorName = "orange";
        light.colorEffect = "pulse";

        await light.turnOn();

        expect(HaWebSocket.sendCmd).toHaveBeenCalledWith("light", "turn_on", "test-id", {
            brightness: 150,
            transition: 3,
            color_temp_kelvin: 3500,
            rgb_color: [128, 64, 192],
            color_name: "orange",
            effect: "pulse",
        });
    });

    it("should mix instance properties and options correctly", async () => {
        light.brightness = 75;
        light.colorTemperature = 2500;
        light.colorName = "green";

        await light.turnOn({
            transition: 7,
            colorRGB: { r: 255, g: 255, b: 0 },
        });

        expect(HaWebSocket.sendCmd).toHaveBeenCalledWith("light", "turn_on", "test-id", {
            brightness: 75,
            transition: 7,
            rgb_color: [255, 255, 0],
        });
    });

    it("should demonstrate color option priority behavior", async () => {
        light.brightness = 100;
        light.colorName = "blue";
        light.colorTemperature = 2700;
        light.colorEffect = "strobe";
        await light.turnOn({
            colorRGB: { r: 255, g: 0, b: 0 },
        });

        expect(HaWebSocket.sendCmd).toHaveBeenCalledWith("light", "turn_on", "test-id", {
            brightness: 100,
            rgb_color: [255, 0, 0],
        });
    });

    it("should use instance color properties when no color options provided", async () => {
        light.brightness = 80;
        light.transition = 2;
        light.colorName = "purple";
        light.colorTemperature = 3200;

        await light.turnOn({
            brightness: 120,
        });

        expect(HaWebSocket.sendCmd).toHaveBeenCalledWith("light", "turn_on", "test-id", {
            brightness: 120,
            transition: 2,
            color_name: "purple",
            color_temp_kelvin: 3200,
        });
    });

    describe("Callback Methods", () => {
        beforeEach(() => {
            vi.clearAllMocks();
            vi.spyOn(HaWebSocket, "subscribe").mockResolvedValue(true);
            vi.spyOn(HaWebSocket, "unsubscribe").mockResolvedValue(true);
        });

        it("should register onStateChange callback and call it on state change", async () => {
            const mockCallback = vi.fn();

            light.onStateChange = mockCallback;

            expect(HaWebSocket.subscribe).toHaveBeenCalledWith("test-id", expect.any(Function));

            const subscribeCall = (HaWebSocket.subscribe as any).mock.calls[0];
            const internalCallback = subscribeCall[1];

            const mockHaEvent = createStateChangeEvent("off", "on", { brightness: 100 }, { brightness: 200 });
            internalCallback(mockHaEvent);

            expect(mockCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    newState: expect.objectContaining({ status: "on" }),
                    oldState: expect.objectContaining({ status: "off" }),
                })
            );
        });

        it("should register onTurnOn callback and call it only when turning on", async () => {
            const mockCallback = vi.fn();

            light.onTurnOn = mockCallback;

            expect(HaWebSocket.subscribe).toHaveBeenCalledWith("test-id", expect.any(Function));

            const subscribeCall = (HaWebSocket.subscribe as any).mock.calls[0];
            const internalCallback = subscribeCall[1];

            const turnOnEvent = createTurnOnEvent();

            internalCallback(turnOnEvent);
            expect(mockCallback).toHaveBeenCalledTimes(1);

            const turnOffEvent = createTurnOffEvent();

            internalCallback(turnOffEvent);
            expect(mockCallback).toHaveBeenCalledTimes(1);

            const brightnessChangeEvent = createBrightnessChangeEvent(100, 200);

            internalCallback(brightnessChangeEvent);
            expect(mockCallback).toHaveBeenCalledTimes(1);
        });

        it("should register onTurnOff callback and call it only when turning off", async () => {
            const mockCallback = vi.fn();

            light.onTurnOff = mockCallback;

            expect(HaWebSocket.subscribe).toHaveBeenCalledWith("test-id", expect.any(Function));

            const subscribeCall = (HaWebSocket.subscribe as any).mock.calls[0];
            const internalCallback = subscribeCall[1];

            const turnOffEvent = createTurnOffEvent();

            internalCallback(turnOffEvent);
            expect(mockCallback).toHaveBeenCalledTimes(1);

            const turnOnEvent = createTurnOnEvent();

            internalCallback(turnOnEvent);
            expect(mockCallback).toHaveBeenCalledTimes(1);
        });

        it("should support multiple callbacks for different events", async () => {
            const onTurnOnCallback = vi.fn();
            const onTurnOffCallback = vi.fn();
            const onStateChangeCallback = vi.fn();

            light.onTurnOn = onTurnOnCallback;
            light.onTurnOff = onTurnOffCallback;
            light.onStateChange = onStateChangeCallback;

            const subscribeCall = (HaWebSocket.subscribe as any).mock.calls[0];
            const internalCallback = subscribeCall[1];

            const turnOnEvent = createStateChangeEvent("off", "on", { brightness: 0 }, { brightness: 150 });

            internalCallback(turnOnEvent);

            expect(onTurnOnCallback).toHaveBeenCalledTimes(1);
            expect(onTurnOffCallback).toHaveBeenCalledTimes(0);
            expect(onStateChangeCallback).toHaveBeenCalledTimes(1);

            const turnOffEvent = createStateChangeEvent("on", "off", { brightness: 150 }, { brightness: 0 });

            internalCallback(turnOffEvent);

            expect(onTurnOnCallback).toHaveBeenCalledTimes(1);
            expect(onTurnOffCallback).toHaveBeenCalledTimes(1);
            expect(onStateChangeCallback).toHaveBeenCalledTimes(2);
        });

        it("should remove callbacks correctly", async () => {
            const onTurnOnCallback = vi.fn();
            const onStateChangeCallback = vi.fn();

            light.onTurnOn = onTurnOnCallback;
            light.onStateChange = onStateChangeCallback;

            light.removeOnTurnOn(onTurnOnCallback);

            const subscribeCall = (HaWebSocket.subscribe as any).mock.calls[0];
            const internalCallback = subscribeCall[1];

            const turnOnEvent = createTurnOnEvent();

            internalCallback(turnOnEvent);

            expect(onTurnOnCallback).toHaveBeenCalledTimes(0);
            expect(onStateChangeCallback).toHaveBeenCalledTimes(1);
        });

        describe("Cleanup with subscription sink", () => {
            it("onTurnOn should register cleaners in sink and cleaner should remove listener", async () => {
                const fakeSub = { addCleaner: vi.fn() };

                (HaWebSocket.getOnConnectSubscriptionInProgress as any) = vi.fn().mockReturnValue(fakeSub);

                const removeSpy = vi.spyOn(light as any, "removeOnStateChange");
                const cb = vi.fn();

                light.onTurnOn = cb;

                expect(HaWebSocket.subscribe).toHaveBeenCalledWith("test-id", expect.any(Function));
                expect(fakeSub.addCleaner).toHaveBeenCalledTimes(2);
                const cleaner1 = (fakeSub.addCleaner as any).mock.calls[0][0];
                const cleaner2 = (fakeSub.addCleaner as any).mock.calls[1][0];
                expect(typeof cleaner1).toBe("function");
                expect(typeof cleaner2).toBe("function");

                cleaner2();
                expect(removeSpy).toHaveBeenCalledTimes(1);
            });

            it("onTurnOn and onTurnOff cleaners should unsubscribe when no listeners remain", async () => {
                const fakeSub = { addCleaner: vi.fn() };
                (HaWebSocket.getOnConnectSubscriptionInProgress as any) = vi.fn().mockReturnValue(fakeSub);

                const onCb = vi.fn();
                const offCb = vi.fn();

                light.onTurnOn = onCb;
                light.onTurnOff = offCb;

                expect(fakeSub.addCleaner).toHaveBeenCalledTimes(4);

                const cleanerOn = (fakeSub.addCleaner as any).mock.calls[1][0];
                const cleanerOff = (fakeSub.addCleaner as any).mock.calls[3][0];
                expect(typeof cleanerOn).toBe("function");
                expect(typeof cleanerOff).toBe("function");

                cleanerOn();
                cleanerOn();
                expect(HaWebSocket.unsubscribe).not.toHaveBeenCalled();

                cleanerOff();
                expect(HaWebSocket.unsubscribe).toHaveBeenCalledWith("test-id");
            });
        });
    });

    describe("setState", () => {
        it("should set light state with basic properties", () => {
            const mockDto = {
                state: "on",
                attributes: {
                    brightness: 200,
                    rgb_color: [255, 128, 0] as [number, number, number],
                    color_temp_kelvin: 3000,
                },
                last_changed: new Date().toISOString(),
                last_reported: new Date().toISOString(),
                last_updated: new Date().toISOString(),
            };

            light.setState(mockDto);

            expect(light.state.status).toBe("on");
            expect(light.state.brightness).toBe(200);
            expect(light.state.colorRGB).toEqual({ r: 255, g: 128, b: 0 });
            expect(light.state.colorTemperature).toBe(3000);
            expect(light.state.lastChanged).toBeInstanceOf(Date);
        });

        it("should handle off state with no attributes", () => {
            const mockDto = {
                state: "off",
                attributes: {},
                last_changed: new Date().toISOString(),
                last_reported: new Date().toISOString(),
                last_updated: new Date().toISOString(),
            };

            light.setState(mockDto);

            expect(light.state.status).toBe("off");
            expect(light.state.brightness).toBeUndefined();
            expect(light.state.colorRGB).toBeUndefined();
            expect(light.state.colorTemperature).toBeUndefined();
        });

        it("should handle partial light attributes", () => {
            const mockDto = {
                state: "on",
                attributes: {
                    brightness: 150,
                },
                last_changed: new Date().toISOString(),
                last_reported: new Date().toISOString(),
                last_updated: new Date().toISOString(),
            };

            light.setState(mockDto);

            expect(light.state.status).toBe("on");
            expect(light.state.brightness).toBe(150);
            expect(light.state.colorRGB).toBeUndefined();
            expect(light.state.colorTemperature).toBeUndefined();
        });

        it("should handle RGB color mapping correctly", () => {
            const mockDto = {
                state: "on",
                attributes: {
                    rgb_color: [255, 0, 128] as [number, number, number],
                },
                last_changed: new Date().toISOString(),
                last_reported: new Date().toISOString(),
                last_updated: new Date().toISOString(),
            };

            light.setState(mockDto);

            expect(light.state.colorRGB).toEqual({ r: 255, g: 0, b: 128 });
        });

        it("should handle undefined RGB color", () => {
            const mockDto = {
                state: "on",
                attributes: {
                    brightness: 100,
                },
                last_changed: new Date().toISOString(),
                last_reported: new Date().toISOString(),
                last_updated: new Date().toISOString(),
            };

            light.setState(mockDto);

            expect(light.state.colorRGB).toBeUndefined();
        });

        it("should overwrite previous state completely", () => {
            const initialDto = {
                state: "on",
                attributes: {
                    brightness: 255,
                    rgb_color: [255, 255, 255] as [number, number, number],
                    color_temp_kelvin: 4000,
                },
                last_changed: "2023-01-01T10:00:00.000Z",
                last_reported: "2023-01-01T10:00:00.000Z",
                last_updated: "2023-01-01T10:00:00.000Z",
            };

            light.setState(initialDto);
            expect(light.state.brightness).toBe(255);

            const newDto = {
                state: "off",
                attributes: {
                    brightness: 50,
                },
                last_changed: "2023-01-01T12:00:00.000Z",
                last_reported: "2023-01-01T12:00:00.000Z",
                last_updated: "2023-01-01T12:00:00.000Z",
            };

            light.setState(newDto);
            expect(light.state.status).toBe("off");
            expect(light.state.brightness).toBe(50);
            expect(light.state.colorRGB).toBeUndefined();
            expect(light.state.colorTemperature).toBeUndefined();
        });

        it("should handle all light attributes together", () => {
            const mockDto = {
                state: "on",
                attributes: {
                    brightness: 180,
                    rgb_color: [128, 64, 192] as [number, number, number],
                    color_temp_kelvin: 2700,
                },
                last_changed: new Date().toISOString(),
                last_reported: new Date().toISOString(),
                last_updated: new Date().toISOString(),
            };

            light.setState(mockDto);

            expect(light.state).toEqual({
                status: "on",
                brightness: 180,
                colorRGB: { r: 128, g: 64, b: 192 },
                colorTemperature: 2700,
                lastChanged: expect.any(Date),
                lastReported: expect.any(Date),
                lastUpdated: expect.any(Date),
            });
        });

        it("should preserve inherited AbstractEntity behavior", () => {
            const mockDto = {
                state: "on",
                attributes: {
                    brightness: 100,
                },
                last_changed: "2023-01-01T12:00:00.123456+00:00",
                last_reported: "2023-01-01T12:00:00.123456+00:00",
                last_updated: "2023-01-01T12:00:00.123456+00:00",
            };

            light.setState(mockDto);

            expect(light.state.status).toBe("on");
            expect(light.state.lastChanged).toBeInstanceOf(Date);
            expect(light.state.lastReported).toBeInstanceOf(Date);
            expect(light.state.lastUpdated).toBeInstanceOf(Date);

            expect(light.state.brightness).toBe(100);
        });
    });
});
