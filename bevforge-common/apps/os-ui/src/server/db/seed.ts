/**
 * BevForge OS - Seed Data Script
 *
 * Creates comprehensive test data for the control panel:
 * - Controller nodes (Raspberry Pi, Arduino)
 * - Hardware endpoints (DI, DO, AI, AO, 1WIRE)
 * - Device tiles (vessels, sensors, actuators)
 * - Tile-endpoint bindings
 * - Safety interlocks
 * - Device groups
 * - Historical telemetry data
 * - Current endpoint values
 *
 * Run: npm run seed
 */

import { db } from './client.js';
import {
  controllerNodes,
  hardwareEndpoints,
  deviceTiles,
  tileEndpointBindings,
  safetyInterlocks,
  deviceGroups,
  telemetryReadings,
  endpointCurrent,
} from './schema.js';
import { sql } from 'drizzle-orm';

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function log(message: string) {
  console.log(`[SEED] ${message}`);
}

function generateTimestamps(count: number, hoursBack: number = 24): Date[] {
  const now = new Date();
  const timestamps: Date[] = [];
  const intervalMs = (hoursBack * 60 * 60 * 1000) / count;

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(now.getTime() - (count - i) * intervalMs);
    timestamps.push(timestamp);
  }

  return timestamps;
}

function randomValue(min: number, max: number, decimals: number = 2): number {
  const value = Math.random() * (max - min) + min;
  return Number(value.toFixed(decimals));
}

function randomBool(trueProbability: number = 0.5): boolean {
  return Math.random() < trueProbability;
}

// ============================================================
// MAIN SEED FUNCTION
// ============================================================

async function seed() {
  try {
    log('Starting seed data creation...');

    // Clear existing data (in reverse dependency order)
    log('Clearing existing data...');
    await db.delete(endpointCurrent);
    await db.delete(telemetryReadings);
    await db.delete(tileEndpointBindings);
    await db.delete(safetyInterlocks);
    await db.delete(deviceGroups);
    await db.delete(deviceTiles);
    await db.delete(hardwareEndpoints);
    await db.delete(controllerNodes);
    log('Existing data cleared');

    // ============================================================
    // STEP 1: CONTROLLER NODES
    // ============================================================
    log('Creating controller nodes...');

    const nodeResults = await db.insert(controllerNodes).values([
      {
        nodeId: 'brewhouse-rpi-001',
        name: 'Brewhouse Controller',
        nodeType: 'raspberry_pi',
        ipAddress: '192.168.1.100',
        status: 'active',
        lastHeartbeat: new Date(),
        config: JSON.stringify({
          model: 'Raspberry Pi 4B',
          os: 'Raspbian Bullseye',
          gpio_pins: 40,
          i2c_enabled: true,
          spi_enabled: true,
          onewire_enabled: true,
        }),
      },
      {
        nodeId: 'fermentation-arduino-001',
        name: 'Fermentation Controller',
        nodeType: 'arduino',
        ipAddress: '192.168.1.101',
        status: 'active',
        lastHeartbeat: new Date(),
        config: JSON.stringify({
          model: 'Arduino Mega 2560',
          digital_pins: 54,
          analog_pins: 16,
          pwm_pins: 15,
        }),
      },
    ]);

    const brewhouseNodeId = Number(nodeResults[0].insertId);
    const fermentationNodeId = Number(nodeResults[0].insertId) + 1;

    log(`Created nodes: Brewhouse (${brewhouseNodeId}), Fermentation (${fermentationNodeId})`);

    // ============================================================
    // STEP 2: HARDWARE ENDPOINTS
    // ============================================================
    log('Creating hardware endpoints...');

    const endpointResults = await db.insert(hardwareEndpoints).values([
      // Brewhouse - Digital Inputs (DI)
      {
        nodeId: brewhouseNodeId,
        name: 'HLT Level Sensor',
        endpointKind: 'DI',
        address: 'GPIO17',
        valueType: 'bool',
        status: 'active',
        config: JSON.stringify({ pin: 17, pullup: true }),
      },
      {
        nodeId: brewhouseNodeId,
        name: 'Mash Tun Level Sensor',
        endpointKind: 'DI',
        address: 'GPIO27',
        valueType: 'bool',
        status: 'active',
        config: JSON.stringify({ pin: 27, pullup: true }),
      },
      {
        nodeId: brewhouseNodeId,
        name: 'Door Interlock Switch',
        endpointKind: 'DI',
        address: 'GPIO22',
        valueType: 'bool',
        status: 'active',
        config: JSON.stringify({ pin: 22, pullup: true }),
      },

      // Brewhouse - Digital Outputs (DO)
      {
        nodeId: brewhouseNodeId,
        name: 'HLT Pump Relay',
        endpointKind: 'DO',
        address: 'GPIO23',
        valueType: 'bool',
        status: 'active',
        failsafeValue: JSON.stringify(false),
        config: JSON.stringify({ pin: 23, active_high: true }),
      },
      {
        nodeId: brewhouseNodeId,
        name: 'Mash Pump Relay',
        endpointKind: 'DO',
        address: 'GPIO24',
        valueType: 'bool',
        status: 'active',
        failsafeValue: JSON.stringify(false),
        config: JSON.stringify({ pin: 24, active_high: true }),
      },
      {
        nodeId: brewhouseNodeId,
        name: 'HLT Inlet Valve',
        endpointKind: 'DO',
        address: 'GPIO25',
        valueType: 'bool',
        status: 'active',
        failsafeValue: JSON.stringify(false),
        config: JSON.stringify({ pin: 25, active_high: true }),
      },
      {
        nodeId: brewhouseNodeId,
        name: 'Mash Inlet Valve',
        endpointKind: 'DO',
        address: 'GPIO26',
        valueType: 'bool',
        status: 'active',
        failsafeValue: JSON.stringify(false),
        config: JSON.stringify({ pin: 26, active_high: true }),
      },

      // Brewhouse - Analog Inputs (AI)
      {
        nodeId: brewhouseNodeId,
        name: 'HLT Pressure Sensor',
        endpointKind: 'AI',
        address: 'ADS1115_0',
        valueType: 'float',
        unit: 'psi',
        status: 'active',
        config: JSON.stringify({
          i2c_address: '0x48',
          channel: 0,
          gain: 1,
          min_raw: 0,
          max_raw: 32767,
          min_eng: 0,
          max_eng: 30,
        }),
      },
      {
        nodeId: brewhouseNodeId,
        name: 'Mash Tun Pressure Sensor',
        endpointKind: 'AI',
        address: 'ADS1115_1',
        valueType: 'float',
        unit: 'psi',
        status: 'active',
        config: JSON.stringify({
          i2c_address: '0x48',
          channel: 1,
          gain: 1,
          min_raw: 0,
          max_raw: 32767,
          min_eng: 0,
          max_eng: 30,
        }),
      },

      // Brewhouse - Analog Outputs (AO)
      {
        nodeId: brewhouseNodeId,
        name: 'HLT Heater Control',
        endpointKind: 'PWM',
        address: 'GPIO18',
        valueType: 'float',
        unit: '%',
        status: 'active',
        failsafeValue: JSON.stringify(0),
        config: JSON.stringify({
          pin: 18,
          frequency: 1000,
          min_duty: 0,
          max_duty: 100,
        }),
      },

      // Brewhouse - 1-Wire Temperature Sensors
      {
        nodeId: brewhouseNodeId,
        name: 'HLT Temperature Sensor',
        endpointKind: '1WIRE',
        address: '28-00000a1b2c3d',
        valueType: 'float',
        unit: '°F',
        status: 'active',
        config: JSON.stringify({
          sensor_type: 'DS18B20',
          resolution: 12,
        }),
      },
      {
        nodeId: brewhouseNodeId,
        name: 'Mash Tun Temperature Sensor',
        endpointKind: '1WIRE',
        address: '28-00000a1b2c4e',
        valueType: 'float',
        unit: '°F',
        status: 'active',
        config: JSON.stringify({
          sensor_type: 'DS18B20',
          resolution: 12,
        }),
      },

      // Fermentation - Temperature Sensors
      {
        nodeId: fermentationNodeId,
        name: 'Fermenter 1 Temperature',
        endpointKind: 'AI',
        address: 'A0',
        valueType: 'float',
        unit: '°F',
        status: 'active',
        config: JSON.stringify({
          pin: 'A0',
          sensor_type: 'TMP36',
          min_raw: 0,
          max_raw: 1023,
          min_eng: 32,
          max_eng: 212,
        }),
      },
      {
        nodeId: fermentationNodeId,
        name: 'Fermenter 2 Temperature',
        endpointKind: 'AI',
        address: 'A1',
        valueType: 'float',
        unit: '°F',
        status: 'active',
        config: JSON.stringify({
          pin: 'A1',
          sensor_type: 'TMP36',
          min_raw: 0,
          max_raw: 1023,
          min_eng: 32,
          max_eng: 212,
        }),
      },

      // Fermentation - Cooling Control
      {
        nodeId: fermentationNodeId,
        name: 'Fermenter 1 Cooling',
        endpointKind: 'DO',
        address: 'D2',
        valueType: 'bool',
        status: 'active',
        failsafeValue: JSON.stringify(false),
        config: JSON.stringify({ pin: 2, active_high: true }),
      },
      {
        nodeId: fermentationNodeId,
        name: 'Fermenter 2 Cooling',
        endpointKind: 'DO',
        address: 'D3',
        valueType: 'bool',
        status: 'active',
        failsafeValue: JSON.stringify(false),
        config: JSON.stringify({ pin: 3, active_high: true }),
      },
    ]);

    const firstEndpointId = Number(endpointResults[0].insertId);
    log(`Created ${endpointResults[0].affectedRows} hardware endpoints starting at ID ${firstEndpointId}`);

    // Map endpoint names to IDs for reference
    const endpointIds = {
      hltLevelSensor: firstEndpointId,
      mashLevelSensor: firstEndpointId + 1,
      doorInterlock: firstEndpointId + 2,
      hltPumpRelay: firstEndpointId + 3,
      mashPumpRelay: firstEndpointId + 4,
      hltInletValve: firstEndpointId + 5,
      mashInletValve: firstEndpointId + 6,
      hltPressure: firstEndpointId + 7,
      mashPressure: firstEndpointId + 8,
      hltHeater: firstEndpointId + 9,
      hltTemp: firstEndpointId + 10,
      mashTemp: firstEndpointId + 11,
      ferm1Temp: firstEndpointId + 12,
      ferm2Temp: firstEndpointId + 13,
      ferm1Cooling: firstEndpointId + 14,
      ferm2Cooling: firstEndpointId + 15,
    };

    log('Endpoint mapping created');

    // Store for later use
    (global as any).seedData = {
      brewhouseNodeId,
      fermentationNodeId,
      endpointIds,
    };

    log('Seed data structure initialized');

    // ============================================================
    // STEP 3: DEVICE TILES
    // ============================================================
    log('Creating device tiles...');

    const tileResults = await db.insert(deviceTiles).values([
      // Vessels
      {
        tileId: 'tile-hlt-001',
        tileType: 'vessel',
        name: 'Hot Liquor Tank',
        positionX: '50',
        positionY: '100',
        width: '200',
        height: '300',
        status: 'operational',
        config: JSON.stringify({
          capacity: 20,
          capacityUnit: 'gal',
          material: 'stainless_steel',
          hasAgitator: false,
          hasJacket: false,
        }),
      },
      {
        tileId: 'tile-mash-001',
        tileType: 'vessel',
        name: 'Mash Tun',
        positionX: '300',
        positionY: '100',
        width: '200',
        height: '300',
        status: 'operational',
        config: JSON.stringify({
          capacity: 15,
          capacityUnit: 'gal',
          material: 'stainless_steel',
          hasAgitator: true,
          hasJacket: false,
        }),
      },

      // Temperature Sensors (children of vessels)
      {
        tileId: 'tile-hlt-temp-001',
        tileType: 'temp_sensor',
        name: 'HLT Temperature',
        parentTileId: null, // Will update after getting IDs
        positionX: '100',
        positionY: '150',
        width: '100',
        height: '80',
        config: JSON.stringify({
          sensorType: 'DS18B20',
          minValue: 32,
          maxValue: 212,
          unit: '°F',
        }),
      },
      {
        tileId: 'tile-mash-temp-001',
        tileType: 'temp_sensor',
        name: 'Mash Tun Temperature',
        parentTileId: null,
        positionX: '350',
        positionY: '150',
        width: '100',
        height: '80',
        config: JSON.stringify({
          sensorType: 'DS18B20',
          minValue: 32,
          maxValue: 212,
          unit: '°F',
        }),
      },

      // Pumps
      {
        tileId: 'tile-hlt-pump-001',
        tileType: 'pump',
        name: 'HLT Pump',
        positionX: '150',
        positionY: '450',
        width: '100',
        height: '80',
        config: JSON.stringify({
          pumpType: 'centrifugal',
          maxFlowRate: 10,
          flowRateUnit: 'gpm',
          hasVFD: false,
        }),
      },
      {
        tileId: 'tile-mash-pump-001',
        tileType: 'pump',
        name: 'Mash Pump',
        positionX: '400',
        positionY: '450',
        width: '100',
        height: '80',
        config: JSON.stringify({
          pumpType: 'centrifugal',
          maxFlowRate: 8,
          flowRateUnit: 'gpm',
          hasVFD: false,
        }),
      },

      // Valves
      {
        tileId: 'tile-hlt-valve-001',
        tileType: 'valve',
        name: 'HLT Inlet Valve',
        positionX: '50',
        positionY: '50',
        width: '80',
        height: '60',
        config: JSON.stringify({
          valveType: 'solenoid',
          normallyOpen: false,
          actuationTime: 1,
        }),
      },
      {
        tileId: 'tile-mash-valve-001',
        tileType: 'valve',
        name: 'Mash Inlet Valve',
        positionX: '300',
        positionY: '50',
        width: '80',
        height: '60',
        config: JSON.stringify({
          valveType: 'solenoid',
          normallyOpen: false,
          actuationTime: 1,
        }),
      },

      // Relay/SSR for heater
      {
        tileId: 'tile-hlt-heater-001',
        tileType: 'relay_ssr',
        name: 'HLT Heater',
        positionX: '100',
        positionY: '250',
        width: '100',
        height: '60',
        config: JSON.stringify({
          relayType: 'SSR',
          maxCurrent: 40,
          currentUnit: 'A',
          hasPWM: true,
        }),
      },
    ]);

    const firstTileId = Number(tileResults[0].insertId);
    log(`Created ${tileResults[0].affectedRows} device tiles starting at ID ${firstTileId}`);

    const tileIds = {
      hlt: firstTileId,
      mashTun: firstTileId + 1,
      hltTempSensor: firstTileId + 2,
      mashTempSensor: firstTileId + 3,
      hltPump: firstTileId + 4,
      mashPump: firstTileId + 5,
      hltInletValve: firstTileId + 6,
      mashInletValve: firstTileId + 7,
      hltHeater: firstTileId + 8,
    };

    // Update parent tile IDs for sensors
    await db
      .update(deviceTiles)
      .set({ parentTileId: tileIds.hlt })
      .where(sql`id = ${tileIds.hltTempSensor}`);

    await db
      .update(deviceTiles)
      .set({ parentTileId: tileIds.mashTun })
      .where(sql`id = ${tileIds.mashTempSensor}`);

    log('Updated parent tile relationships');

    // ============================================================
    // STEP 4: TILE-ENDPOINT BINDINGS
    // ============================================================
    log('Creating tile-endpoint bindings...');

    await db.insert(tileEndpointBindings).values([
      // HLT Temperature Sensor bindings
      {
        tileId: tileIds.hltTempSensor,
        endpointId: endpointIds.hltTemp,
        bindingRole: 'pv',
        direction: 'input',
      },

      // Mash Tun Temperature Sensor bindings
      {
        tileId: tileIds.mashTempSensor,
        endpointId: endpointIds.mashTemp,
        bindingRole: 'pv',
        direction: 'input',
      },

      // HLT Pump bindings
      {
        tileId: tileIds.hltPump,
        endpointId: endpointIds.hltPumpRelay,
        bindingRole: 'output',
        direction: 'output',
      },

      // Mash Pump bindings
      {
        tileId: tileIds.mashPump,
        endpointId: endpointIds.mashPumpRelay,
        bindingRole: 'output',
        direction: 'output',
      },

      // HLT Inlet Valve bindings
      {
        tileId: tileIds.hltInletValve,
        endpointId: endpointIds.hltInletValve,
        bindingRole: 'output',
        direction: 'output',
      },

      // Mash Inlet Valve bindings
      {
        tileId: tileIds.mashInletValve,
        endpointId: endpointIds.mashInletValve,
        bindingRole: 'output',
        direction: 'output',
      },

      // HLT Heater bindings
      {
        tileId: tileIds.hltHeater,
        endpointId: endpointIds.hltHeater,
        bindingRole: 'output',
        direction: 'output',
      },

      // HLT Vessel bindings (level sensor)
      {
        tileId: tileIds.hlt,
        endpointId: endpointIds.hltLevelSensor,
        bindingRole: 'state',
        direction: 'input',
      },

      // Mash Tun Vessel bindings (level sensor)
      {
        tileId: tileIds.mashTun,
        endpointId: endpointIds.mashLevelSensor,
        bindingRole: 'state',
        direction: 'input',
      },
    ]);

    log('Created tile-endpoint bindings');

    // ============================================================
    // STEP 5: SAFETY INTERLOCKS
    // ============================================================
    log('Creating safety interlocks...');

    await db.insert(safetyInterlocks).values([
      {
        name: 'HLT Temperature High Limit',
        description: 'Prevents HLT temperature from exceeding 212°F',
        interlockType: 'conditional',
        affectedTiles: JSON.stringify([tileIds.hltHeater]),
        mode: 'trip',
        condition: JSON.stringify({
          type: 'range',
          endpointId: endpointIds.hltTemp,
          min: 32,
          max: 212,
        }),
        onViolationAction: 'block',
        severity: 'critical',
        isActive: true,
      },
      {
        name: 'Mash Temperature Range',
        description: 'Ensures mash temperature stays within safe range',
        interlockType: 'conditional',
        affectedTiles: JSON.stringify([tileIds.mashTun]),
        mode: 'permissive',
        condition: JSON.stringify({
          type: 'range',
          endpointId: endpointIds.mashTemp,
          min: 32,
          max: 180,
        }),
        onViolationAction: 'block',
        severity: 'warning',
        isActive: true,
      },
      {
        name: 'HLT Pressure High Limit',
        description: 'Protects against over-pressurization',
        interlockType: 'conditional',
        affectedTiles: JSON.stringify([tileIds.hlt]),
        mode: 'trip',
        condition: JSON.stringify({
          type: 'range',
          endpointId: endpointIds.hltPressure,
          min: 0,
          max: 25,
        }),
        onViolationAction: 'force_off',
        severity: 'critical',
        isActive: true,
      },
      {
        name: 'Pump Dry Run Protection',
        description: 'Prevents pump from running without liquid',
        interlockType: 'permissive',
        affectedTiles: JSON.stringify([tileIds.hltPump]),
        mode: 'permissive',
        condition: JSON.stringify({
          type: 'require_level',
          endpointId: endpointIds.hltLevelSensor,
          requiredState: true,
        }),
        onViolationAction: 'block',
        severity: 'warning',
        isActive: true,
      },
      {
        name: 'Door Interlock',
        description: 'Requires door to be closed before operation',
        interlockType: 'permissive',
        affectedTiles: JSON.stringify([]),
        mode: 'permissive',
        condition: JSON.stringify({
          type: 'require_closed',
          endpointId: endpointIds.doorInterlock,
          requiredState: true,
        }),
        onViolationAction: 'block',
        severity: 'warning',
        isActive: true,
      },
    ]);

    log('Created safety interlocks');

    // ============================================================
    // STEP 6: DEVICE GROUPS
    // ============================================================
    log('Creating device groups...');

    await db.insert(deviceGroups).values([
      {
        name: 'Brewhouse Pumps',
        tileIds: JSON.stringify([tileIds.hltPump, tileIds.mashPump]),
        mutualExclusion: true,
        mutexPolicy: 'block',
      },
      {
        name: 'Inlet Valves',
        tileIds: JSON.stringify([tileIds.hltInletValve, tileIds.mashInletValve]),
        mutualExclusion: false,
        mutexPolicy: null,
      },
    ]);

    log('Created device groups');

    // ============================================================
    // STEP 7: HISTORICAL TELEMETRY DATA
    // ============================================================
    log('Generating historical telemetry data...');

    const timestamps = generateTimestamps(1000, 24);
    const telemetryData: any[] = [];

    // Generate realistic temperature data with slow drift
    let hltTemp = 68; // Start at room temp
    let mashTemp = 68;

    for (const timestamp of timestamps) {
      // HLT Temperature (slowly heating up)
      hltTemp += randomValue(-0.5, 1.5);
      hltTemp = Math.max(65, Math.min(180, hltTemp)); // Clamp

      telemetryData.push({
        endpointId: endpointIds.hltTemp,
        timestamp,
        valueNum: Number(hltTemp.toFixed(2)),
        quality: 'good',
        source: 'hardware',
      });

      // Mash Tun Temperature (following HLT with lag)
      mashTemp += randomValue(-0.3, 0.8);
      mashTemp = Math.max(65, Math.min(170, mashTemp));

      telemetryData.push({
        endpointId: endpointIds.mashTemp,
        timestamp,
        valueNum: Number(mashTemp.toFixed(2)),
        quality: 'good',
        source: 'hardware',
      });

      // HLT Pressure (stable around 5 psi)
      const hltPressure = randomValue(4.5, 5.5);
      telemetryData.push({
        endpointId: endpointIds.hltPressure,
        timestamp,
        valueNum: Number(hltPressure.toFixed(2)),
        quality: 'good',
        source: 'hardware',
      });

      // Mash Pressure (stable around 3 psi)
      const mashPressure = randomValue(2.8, 3.2);
      telemetryData.push({
        endpointId: endpointIds.mashPressure,
        timestamp,
        valueNum: Number(mashPressure.toFixed(2)),
        quality: 'good',
        source: 'hardware',
      });

      // Level sensors (mostly true, occasional false)
      telemetryData.push({
        endpointId: endpointIds.hltLevelSensor,
        timestamp,
        valueBool: randomBool(0.9),
        quality: 'good',
        source: 'hardware',
      });

      telemetryData.push({
        endpointId: endpointIds.mashLevelSensor,
        timestamp,
        valueBool: randomBool(0.85),
        quality: 'good',
        source: 'hardware',
      });

      // Door interlock (mostly closed)
      telemetryData.push({
        endpointId: endpointIds.doorInterlock,
        timestamp,
        valueBool: randomBool(0.95),
        quality: 'good',
        source: 'hardware',
      });
    }

    // Insert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < telemetryData.length; i += batchSize) {
      const batch = telemetryData.slice(i, i + batchSize);
      await db.insert(telemetryReadings).values(batch);
    }

    log(`Generated ${telemetryData.length} telemetry readings`);

    // ============================================================
    // STEP 8: ENDPOINT_CURRENT CACHE
    // ============================================================
    log('Populating endpoint_current cache...');

    const now = new Date();

    await db.insert(endpointCurrent).values([
      // Temperature sensors
      {
        endpointId: endpointIds.hltTemp,
        timestamp: now,
        valueNum: hltTemp,
        quality: 'good',
        source: 'hardware',
      },
      {
        endpointId: endpointIds.mashTemp,
        timestamp: now,
        valueNum: mashTemp,
        quality: 'good',
        source: 'hardware',
      },

      // Pressure sensors
      {
        endpointId: endpointIds.hltPressure,
        timestamp: now,
        valueNum: 5.0,
        quality: 'good',
        source: 'hardware',
      },
      {
        endpointId: endpointIds.mashPressure,
        timestamp: now,
        valueNum: 3.0,
        quality: 'good',
        source: 'hardware',
      },

      // Level sensors
      {
        endpointId: endpointIds.hltLevelSensor,
        timestamp: now,
        valueBool: true,
        quality: 'good',
        source: 'hardware',
      },
      {
        endpointId: endpointIds.mashLevelSensor,
        timestamp: now,
        valueBool: true,
        quality: 'good',
        source: 'hardware',
      },

      // Door interlock
      {
        endpointId: endpointIds.doorInterlock,
        timestamp: now,
        valueBool: true,
        quality: 'good',
        source: 'hardware',
      },

      // Pumps (off)
      {
        endpointId: endpointIds.hltPumpRelay,
        timestamp: now,
        valueBool: false,
        quality: 'good',
        source: 'command',
      },
      {
        endpointId: endpointIds.mashPumpRelay,
        timestamp: now,
        valueBool: false,
        quality: 'good',
        source: 'command',
      },

      // Valves (closed)
      {
        endpointId: endpointIds.hltInletValve,
        timestamp: now,
        valueBool: false,
        quality: 'good',
        source: 'command',
      },
      {
        endpointId: endpointIds.mashInletValve,
        timestamp: now,
        valueBool: false,
        quality: 'good',
        source: 'command',
      },

      // Heater (off)
      {
        endpointId: endpointIds.hltHeater,
        timestamp: now,
        valueNum: 0,
        quality: 'good',
        source: 'command',
      },
    ]);

    log('Populated endpoint_current cache');

    log('Seed data structure initialized');
  } catch (error) {
    console.error('[SEED] Error:', error);
    throw error;
  }
}

// ============================================================
// RUN SEED
// ============================================================

seed()
  .then(() => {
    log('Seed data creation completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[SEED] Fatal error:', error);
    process.exit(1);
  });
