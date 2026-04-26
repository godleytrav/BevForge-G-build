import { m as readDevices } from '../../recipes/import/POST-B16W0CFH.js';

async function handler(_req, res) {
  try {
    const devices = await readDevices();
    res.status(200).json({ success: true, data: devices });
  } catch (error) {
    console.error("Failed to read devices:", error);
    res.status(500).json({
      success: false,
      error: "Failed to read device registry"
    });
  }
}

export { handler as h };
