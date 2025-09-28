import { describe, it, expect, beforeEach, vi } from "vitest";
import { HaWebSocket } from "../haWebSocket";

const resetInternals = () => {
    (HaWebSocket as any).onConnectSubscriptionMap = new Map();
    (HaWebSocket as any).onConnectSubscriptionsInProgress = [];
    (HaWebSocket as any).haIdEntityDico = {};
    (HaWebSocket as any).callBackResultDico = {};
    (HaWebSocket as any).entitySubscriptionDico = {};
    (HaWebSocket as any).idIdentifie = 0;
    (HaWebSocket as any).callBackDico = {};
    (HaWebSocket as any).isAuthenticated = false;
};

describe("HaWebSocket - subscription stack", () => {
    beforeEach(() => {
        resetInternals();
        vi.restoreAllMocks();
    });

    it("getOnConnectSubscriptionInProgress should return null when stack is empty", () => {
        expect(HaWebSocket.getOnConnectSubscriptionInProgress()).toBeNull();
    });

    it("add/remove subscription in progress should behave like a stack (LIFO)", () => {
        const sub1 = { name: "sub1" } as any;
        const sub2 = { name: "sub2" } as any;

        HaWebSocket.addSubscriptionInProgress(sub1 as any);
        expect(HaWebSocket.getOnConnectSubscriptionInProgress()).toBe(sub1);

        HaWebSocket.addSubscriptionInProgress(sub2 as any);
        expect(HaWebSocket.getOnConnectSubscriptionInProgress()).toBe(sub2);

        HaWebSocket.removeSubscriptionInProgress();
        expect(HaWebSocket.getOnConnectSubscriptionInProgress()).toBe(sub1);

        HaWebSocket.removeSubscriptionInProgress();
        expect(HaWebSocket.getOnConnectSubscriptionInProgress()).toBeNull();
    });
});

describe("HaWebSocket - onConnect execution and cleanup", () => {
    beforeEach(() => {
        resetInternals();
        vi.restoreAllMocks();
    });

    it("should execute onConnect handler immediately when authenticated and register cleaners", () => {
        (HaWebSocket as any).isAuthenticated = true;

        const sessionCleaner = vi.fn();
        const returnedCleaner = vi.fn();

        const handler = vi.fn((session: any) => {
            expect(HaWebSocket.getOnConnectSubscriptionInProgress()).not.toBeNull();
            session.onEnd = sessionCleaner as any;
            return returnedCleaner;
        });

        HaWebSocket.onConnect(handler as any);
        expect(handler).toHaveBeenCalledTimes(1);

        HaWebSocket.removeOnConnect(handler as any);
        expect(sessionCleaner).toHaveBeenCalledTimes(1);
        expect(returnedCleaner).toHaveBeenCalledTimes(1);

        expect((HaWebSocket as any).onConnectSubscriptionMap.size).toBe(0);
    });
});
