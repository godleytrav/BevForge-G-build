import { d as readCanvasProject } from '../../recipes/import/POST-B16W0CFH.js';

async function handler(_req, res) {
  try {
    const project = await readCanvasProject();
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    console.error("Failed to read canvas project:", error);
    res.status(500).json({
      success: false,
      error: "Failed to read canvas project"
    });
  }
}

export { handler as h };
