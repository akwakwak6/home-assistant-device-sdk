# Home Assistant Device SDK

Create TypeScript automations for Home Assistant with full type safety and IntelliSense. This SDK generates a typed interface from your Home Assistant instance, allowing you to control your devices with autocompletion and compile-time checks.

## 1. Quick Start

### Installation

```bash
npm install home-assistant-device-sdk
```

### Generate Device File

Use the CLI to connect to your Home Assistant instance and generate the `ha.ts` file. You will need a Long-Lived Access Token.

**CLI Options:**

-   `-u, --url <url>`: The URL of your Home Assistant instance. Can also be set via the `HA_URL` environment variable.
-   `-t, --token <token>`: Your Long-Lived Access Token. Can also be set via the `HA_TOKEN` environment variable.
-   `-o, --out <file>`: The path where the generated `ha.ts` file will be saved. Defaults to `src/ha.ts`.

```bash
npx hasdk --url http://localhost:8123 --token YOUR_TOKEN
```

> **Tip:** You can create a Long-Lived Access Token in your Home Assistant profile page, under the "Security" section.

### Use in Your Code

```typescript
import { HA } from "./ha";

// Connect to Home Assistant
await HA.connect({
    url: "http://localhost:8123",
    token: "YOUR_LONG_LIVED_ACCESS_TOKEN",
});

// Control your devices with type safety
HA.devices.lightOffice.turnOn({ brightness: 255 });
```

## 2. Using Environment Variables

For convenience and security, you can provide credentials via environment variables instead of command-line arguments. The SDK will automatically pick them up for both code generation and at runtime.

```bash
export HA_URL="http://localhost:8123"
export HA_TOKEN="your_token"

# Now you can run the generator without credentials
npx hasdk
```

At runtime, `HA.connect()` will also use these variables if no `url` or `token` is provided.

### Credential Priority

The SDK resolves credentials in the following order (highest to lowest):

1.  **Direct Parameters:** Passed to `HA.connect()` or `buildHaFile()`.
2.  **Environment Variables:** `HA_URL` and `HA_TOKEN`.
3.  **Configuration File:** A custom DAL or the default `.hasdk.config.json` file (used by the runtime if credentials are manually added).

## 3. Handling Connections with `HA.onConnect`

`⚠️ The HA.onConnect handler is the recommended place to register all your event-driven logic.` It is a function that the SDK executes every time a successful connection to Home Assistant is established, including on automatic reconnections.

This ensures your automations are resilient and re-established correctly if the connection drops.

```typescript
import type { IEntitySession } from "home-assistant-device-sdk";

function morningAutomations(session: IEntitySession) {
    console.log("Morning automations are now active.");
    HA.devices.mySwitch.onStateChange = (state) => {
        console.log("Switch state changed during the day.");
    };
}

function eveningAutomations(session: IEntitySession) {
    console.log("Evening automations are now active.");
    HA.devices.mySwitch.onStateChange = (state) => {
        console.log("Switch state changed during the evening.");
    };
}

// Set the morning routine initially
HA.onConnect = morningAutomations;

// Later, to switch to the evening routine...
console.log("Switching to evening automations.");
HA.removeOnConnect(morningAutomations); // This cleans up all listeners from the morning routine
HA.onConnect = eveningAutomations; // This activates the evening routine
```

## 4. Cleanup Strategies

To prevent unwanted side effects and memory leaks, the SDK offers several powerful cleanup strategies. When you call `HA.removeOnConnect(handler)` or the connection drops, all associated resources are automatically cleaned up.

### 1. Automatic Cleanup for Direct Assignments

The simplest method: any event listener assigned directly as a property (e.g., `onStateChange = ...`) within your `onConnect` handler is **automatically tracked and removed**.

```typescript
function setupAutomations(session: IEntitySession) {
    // This listener is cleaned up automatically
    HA.devices.mySwitch.onStateChange = (state) => {
        console.log("Switch state changed!");
    };
}
```

### 2. Advanced Cleanup with the `session` Object

For listeners created asynchronously or for non-SDK resources (like timers), the `session` object provides more control.

#### Using `session.track(cleanupFunction)`

The `session.track()` method accepts a **cleanup function** that will be executed automatically when the session ends. This is essential for any resource created asynchronously or for resources the SDK cannot track automatically (like timers).

```typescript
function onConnected(session: IEntitySession) {
    // Example 1: Tracking a listener created asynchronously
    setTimeout(() => {
        const onTurnOnHandler = () => {
            console.log("Switch Bureau left turn on");
        };
        HA.devices.switchBureauLeft.onTurnOn = onTurnOnHandler;

        // Pass the corresponding remove function to track()
        session.track(() => HA.devices.switchBureauLeft.removeOnTurnOn(onTurnOnHandler));
    }, 1000);

    // Example 2: Tracking a timer
    const timerId = setInterval(() => console.log("tick"), 1000);
    session.track(() => clearInterval(timerId));
}
```

#### Using `session.startTrack()` and `session.stopTrack()`

To track a group of listeners created within a specific block of code, wrap them with `startTrack()` and `stopTrack()`.

```typescript
function onConnected(session: IEntitySession) {
    setTimeout(() => {
        session.startTrack(); // Start tracking listeners from here
        HA.devices.switchLeft.onTurnOn = () => {
            console.log("Left on");
        };
        HA.devices.switchLeft.onTurnOff = () => {
            console.log("Left off");
        };
        session.stopTrack(); // Stop tracking
    }, 1000);
}
```

#### Using `session.onEnd`

The `session.onEnd` property is a versatile tool for registering a final cleanup action. It can be used in two ways:

1.  **For Timers:** As a shortcut for `setInterval`, assign its ID to `session.onEnd`. The SDK will automatically call `clearInterval`.

    ```typescript
    function onConnected(session: IEntitySession) {
        session.onEnd = setInterval(() => console.log("tik"), 1000);
    }
    ```

2.  **For a Custom Cleanup Function:** Assign a function to `session.onEnd`. This adds the function to a queue, and all registered functions will be executed during cleanup.

    ```typescript
    function onConnected(session: IEntitySession) {
        session.onEnd = () => {
            console.log("Custom cleanup action executed.");
        };
    }
    ```

### 3. Final Cleanup with a `return` Function

Your `onConnect` handler can return a single function that will be executed as a final cleanup step. This is useful for logic that must run last.

```typescript
function onConnected(session: IEntitySession) {
    const msgState = () => console.log("State changed");
    HA.devices.mySwitch.onStateChange = msgState;

    // This function will be called on cleanup
    return () => {
        console.log("Final cleanup executed!");
        // You can also perform manual cleanup here if needed
        HA.devices.mySwitch.removeOnStateChange(msgState);
    };
}
```

## 5. Configuration File (`.hasdk.config.json`)

When you run the `hagen` CLI, it creates a `.hasdk.config.json` file in your project root. This file allows you to customize how entities are generated.

You can manually edit this file to:

-   **Rename devices:** Change the `name` property for any entity.
-   **Ignore specific entities:** Set the `isUsed` property to `false` for an entity you want to exclude.
-   **Ignore entire device types:** Add a `deviceType` section to disable generation for types like `light`, `switch`, etc.

**Credential Management**

-   The CLI **does not** save your credentials to this file.
-   However, you can manually add a `credentials` object with `url` and `token` properties. The SDK runtime will use these as a fallback if no other connection details are provided (e.g., via `HA.connect()` or environment variables).

**Customizing the File Path**

-   When using the `buildHaFile` function programmatically, you can specify a custom path for the configuration file via the `configPath` option.
-   The `hagen` CLI currently does not support changing the default path (`.hasdk.config.json`).

## 6. Advanced: Custom Data Access Layer (DAL)

For advanced use cases, such as storing configuration in a database or a secure vault, you can provide your own Data Access Layer (DAL) when generating code programmatically with `buildHaFile`.

Your DAL must implement the `IConfigDal` interface.

```typescript
import { buildHaFile, IBuilderHaOption } from "home-assistant-device-sdk";

const options: IBuilderHaOption = {
    // Provide your custom DAL implementation
    configDal: new MySecureConfigDal(),
    out: "./src/ha.ts",
};

await buildHaFile(options);
```
