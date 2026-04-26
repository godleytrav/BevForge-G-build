import { t as writeDevices } from '../../recipes/import/POST-B16W0CFH.js';

async function handler(req, res) {
  try {
    const devices = req.body;
    if (!Array.isArray(devices)) {
      return res.status(400).json({
        success: false,
        error: "Invalid device payload"
      });
    }
    const saved = await writeDevices(devices);
    return res.status(200).json({ success: true, data: saved });
  } catch (error) {
    console.error("Failed to write devices:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to write device registry"
    });
  }
}

export { handler as h };
