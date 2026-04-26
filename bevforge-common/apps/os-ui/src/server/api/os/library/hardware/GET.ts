const payload = {
  categories: {
    sensors: [
      {
        key: "ds18b20",
        label: "DS18B20 Temperature Probe",
        kind: "sensor",
        interface: "1wire",
        driver: "ds18b20",
        config_schema: { required: ["pin"] },
        units: "°C",
        capabilities: ["read"],
      },
      {
        key: "ads1115",
        label: "ADS1115 Analog-to-Digital",
        kind: "sensor",
        interface: "i2c",
        driver: "ads1115",
        config_schema: { required: ["i2c_addr", "channel"] },
        units: "V",
        capabilities: ["read"],
      },
    ],
    relays: [
      {
        key: "ssr-gpio",
        label: "SSR Relay",
        kind: "relay",
        interface: "gpio",
        driver: "ssr",
        config_schema: { required: ["pin"] },
        capabilities: ["write"],
      },
      {
        key: "usb-relay",
        label: "USB Relay",
        kind: "relay",
        interface: "usb",
        driver: "usb-relay",
        config_schema: { required: ["vendor_id", "product_id", "channel"] },
        capabilities: ["write"],
      },
    ],
    motors_actuators: [
      {
        key: "pwm-motor-controller",
        label: "PWM Motor Controller",
        kind: "motor",
        interface: "pwm",
        driver: "pwm-motor",
        config_schema: { required: ["pwm_pin", "enable_pin"] },
        capabilities: ["write", "pwm"],
      },
    ],
    meters: [
      {
        key: "hall-effect-flow",
        label: "Hall Effect Flow Meter",
        kind: "meter",
        interface: "gpio",
        driver: "hall-flow",
        config_schema: { required: ["pin", "pulses_per_liter"] },
        units: "L",
        capabilities: ["read", "interrupt"],
      },
    ],
    valves: [
      {
        key: "solenoid-valve",
        label: "Solenoid Valve",
        kind: "valve",
        interface: "gpio",
        driver: "solenoid",
        config_schema: { required: ["pin"] },
        capabilities: ["write"],
      },
    ],
    controllers: [
      {
        key: "pid-controller",
        label: "PID Controller",
        kind: "controller",
        interface: "network",
        driver: "pid",
        config_schema: { required: ["target", "kp", "ki", "kd"] },
        capabilities: ["read", "write", "pid"],
      },
    ],
    bluetooth_gpio: [
      {
        key: "ble-relay-board",
        label: "BLE Relay Board",
        kind: "relay",
        interface: "ble",
        driver: "ble-relay",
        config_schema: {
          required: ["ble_mac", "service_uuid", "characteristic_uuid"],
        },
        capabilities: ["write"],
      },
    ],
  },
};

export const GET = () =>
  new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
