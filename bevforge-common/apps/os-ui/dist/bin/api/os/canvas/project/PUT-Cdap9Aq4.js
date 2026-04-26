import { f as writeCanvasProject } from '../../recipes/import/POST-B16W0CFH.js';

async function handler(req, res) {
  try {
    const project = req.body;
    if (!project || !project.pages) {
      return res.status(400).json({
        success: false,
        error: "Invalid project payload"
      });
    }
    const saved = await writeCanvasProject(project);
    return res.status(200).json({ success: true, data: saved });
  } catch (error) {
    console.error("Failed to write canvas project:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to write canvas project"
    });
  }
}

export { handler as h };
