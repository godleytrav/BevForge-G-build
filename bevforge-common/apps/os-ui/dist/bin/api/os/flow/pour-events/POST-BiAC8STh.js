import { i as ingestFlowPourEvents } from './GET-LI4duKA3.js';

async function handler(req, res) {
  try {
    const body = req.body;
    const events = Array.isArray(body.events) ? body.events : body.event ? [body.event] : [];
    if (events.length === 0) {
      return res.status(400).json({
        success: false,
        error: "events[] or event is required."
      });
    }
    const ingestion = await ingestFlowPourEvents(events);
    const summary = {
      total: ingestion.results.length,
      accepted: ingestion.results.filter((result) => result.status === "accepted").length,
      acceptedWithShortage: ingestion.results.filter(
        (result) => result.status === "accepted_with_shortage"
      ).length,
      rejected: ingestion.results.filter((result) => result.status === "rejected").length,
      idempotentReplays: ingestion.results.filter((result) => result.idempotentReplay).length
    };
    return res.status(200).json({
      success: true,
      data: {
        summary,
        results: ingestion.results
      }
    });
  } catch (error) {
    console.error("Failed to ingest FLOW pour events:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to ingest FLOW pour events."
    });
  }
}

export { handler as h };
