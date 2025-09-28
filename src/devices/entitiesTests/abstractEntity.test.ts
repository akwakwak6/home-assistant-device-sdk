import { describe, vi, it, expect, beforeEach } from "vitest";
import { HaWebSocket } from "../haWebSocket";
import { AbstractDevice } from "../abstractDevice";

vi.mock("src/utils/mappers/date.mapper", () => ({
    parseISODateWithMicroseconds: vi.fn((input: string) => new Date(input.replace(/\.(\d{3})\d*(?=[+-])/, ".$1"))),
}));

vi.mock("../haWebSocket", () => ({
    HaWebSocket: {
        subscribe: vi.fn().mockResolvedValue(true),
        unsubscribe: vi.fn().mockResolvedValue(true),
        getOnConnectSubscriptionInProgress: vi.fn().mockReturnValue(null),
    },
}));

class TestEntity extends AbstractDevice {
    protected readonly entityType = "test";
    readonly TypeStatus = { ON: "on", OFF: "off" };
    state: any = null;
}

describe("AbstractEntity", () => {
    let entity: TestEntity;

    beforeEach(() => {
        vi.clearAllMocks();
        entity = new TestEntity("test-id", "test-entity");
    });

    describe("setState", () => {
        it("should set state by calling mapDtoToState", () => {
            const mockDto = {
                state: "on",
                last_changed: "2023-01-01T12:00:00.123456+00:00",
                last_reported: "2023-01-01T12:00:00.123456+00:00",
                last_updated: "2023-01-01T12:00:00.123456+00:00",
            };

            entity.setState(mockDto);

            expect(entity.state).toEqual({
                status: "on",
                lastChanged: expect.any(Date),
                lastReported: expect.any(Date),
                lastUpdated: expect.any(Date),
            });
        });

        it("should handle different state values", () => {
            const offStateDto = {
                state: "off",
                last_changed: "2023-01-01T10:00:00.000000+00:00",
                last_reported: "2023-01-01T10:00:00.000000+00:00",
                last_updated: "2023-01-01T10:00:00.000000+00:00",
            };

            entity.setState(offStateDto);

            expect(entity.state.status).toBe("off");
        });

        it("should handle state with attributes", () => {
            const stateWithAttributes = {
                state: "on",
                attributes: { brightness: 255, color_temp: 3000 },
                last_changed: "2023-01-01T12:00:00.123456+00:00",
                last_reported: "2023-01-01T12:00:00.123456+00:00",
                last_updated: "2023-01-01T12:00:00.123456+00:00",
            };

            entity.setState(stateWithAttributes);

            expect(entity.state.status).toBe("on");
            expect(entity.state.lastChanged).toBeInstanceOf(Date);
            expect(entity.state.lastReported).toBeInstanceOf(Date);
            expect(entity.state.lastUpdated).toBeInstanceOf(Date);
        });

        it("should overwrite previous state when called multiple times", () => {
            const firstState = {
                state: "off",
                last_changed: "2023-01-01T10:00:00.000000+00:00",
                last_reported: "2023-01-01T10:00:00.000000+00:00",
                last_updated: "2023-01-01T10:00:00.000000+00:00",
            };

            const secondState = {
                state: "on",
                last_changed: "2023-01-01T12:00:00.000000+00:00",
                last_reported: "2023-01-01T12:00:00.000000+00:00",
                last_updated: "2023-01-01T12:00:00.000000+00:00",
            };

            entity.setState(firstState);
            expect(entity.state.status).toBe("off");

            entity.setState(secondState);
            expect(entity.state.status).toBe("on");
        });

        it("should throw error when given null or undefined input", () => {
            expect(() => entity.setState(null)).toThrow();
            expect(() => entity.setState(undefined)).toThrow();
        });

        it("should handle malformed date strings", () => {
            const stateWithBadDates = {
                state: "on",
                last_changed: "invalid-date",
                last_reported: "invalid-date",
                last_updated: "invalid-date",
            };

            expect(() => entity.setState(stateWithBadDates)).not.toThrow();
            expect(entity.state.status).toBe("on");
        });

        it("should preserve the exact structure returned by mapDtoToState", () => {
            const mockDto = {
                state: "test-state",
                last_changed: "2023-01-01T12:00:00.123456+00:00",
                last_reported: "2023-01-01T12:00:00.123456+00:00",
                last_updated: "2023-01-01T12:00:00.123456+00:00",
            };

            entity.setState(mockDto);

            expect(entity.state).toHaveProperty("status", "test-state");
            expect(entity.state).toHaveProperty("lastChanged");
            expect(entity.state).toHaveProperty("lastReported");
            expect(entity.state).toHaveProperty("lastUpdated");
            expect(Object.keys(entity.state)).toHaveLength(4);
        });
    });

    describe("mapDtoToState (protected method testing)", () => {
        it("should correctly map DTO to state format", () => {
            const dto = {
                state: "on",
                last_changed: "2023-01-01T12:00:00.123456+00:00",
                last_reported: "2023-01-01T12:00:00.123456+00:00",
                last_updated: "2023-01-01T12:00:00.123456+00:00",
            };

            entity.setState(dto);
            const result = entity.state;

            expect(result).toEqual({
                status: "on",
                lastChanged: expect.any(Date),
                lastReported: expect.any(Date),
                lastUpdated: expect.any(Date),
            });
        });
    });

    describe("onStateChange with getOnConnectSubscriptionInProgress()", () => {
        it("should add cleanup to subscription sink when a subscription is in progress", async () => {
            const fakeSub = { addCleaner: vi.fn() };

            (HaWebSocket.getOnConnectSubscriptionInProgress as any) = vi.fn().mockReturnValue(fakeSub);

            const cb = vi.fn();
            const removeSpy = vi.spyOn(entity, "removeOnStateChange");

            entity.onStateChange = cb;

            expect(HaWebSocket.subscribe).toHaveBeenCalledWith("test-id", expect.any(Function));
            expect(fakeSub.addCleaner).toHaveBeenCalledTimes(2);
            const cleaner = (fakeSub.addCleaner as any).mock.calls[0][0];
            expect(typeof cleaner).toBe("function");
            const secondArg = (fakeSub.addCleaner as any).mock.calls[1][0];
            expect(secondArg).toBeUndefined();

            cleaner();
            expect(removeSpy).toHaveBeenCalledWith(cb);
        });

        it("should not add cleanup when there is no subscription in progress", async () => {
            (HaWebSocket.getOnConnectSubscriptionInProgress as any) = vi.fn().mockReturnValue(null);

            const cb = vi.fn();
            entity.onStateChange = cb;

            expect(HaWebSocket.subscribe).toHaveBeenCalledWith("test-id", expect.any(Function));
        });
    });
});
