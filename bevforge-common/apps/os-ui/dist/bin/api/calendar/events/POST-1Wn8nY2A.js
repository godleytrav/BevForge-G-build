import { c as createCalendarEvent } from './GET-DNBekL63.js';

async function handler(req, res) {
  try {
    const body = req.body;
    if (!body || typeof body !== "object") {
      return res.status(400).json({
        success: false,
        error: "Request body is required."
      });
    }
    const created = await createCalendarEvent({
      id: typeof body.id === "string" ? body.id : void 0,
      sourceSuite: body.sourceSuite,
      sourceRecordId: typeof body.sourceRecordId === "string" ? body.sourceRecordId : void 0,
      siteId: typeof body.siteId === "string" ? body.siteId : void 0,
      title: typeof body.title === "string" ? body.title : "",
      description: typeof body.description === "string" ? body.description : void 0,
      type: typeof body.type === "string" ? body.type : void 0,
      status: typeof body.status === "string" ? body.status : void 0,
      priority: typeof body.priority === "string" ? body.priority : void 0,
      startAt: typeof body.startAt === "string" ? body.startAt : "",
      endAt: typeof body.endAt === "string" ? body.endAt : void 0,
      timezone: typeof body.timezone === "string" ? body.timezone : void 0,
      allDay: typeof body.allDay === "boolean" ? body.allDay : void 0,
      tags: Array.isArray(body.tags) ? body.tags.filter((entry) => typeof entry === "string") : void 0,
      links: body.links && typeof body.links === "object" ? {
        openPath: typeof body.links.openPath === "string" ? body.links.openPath : void 0,
        openUrl: typeof body.links.openUrl === "string" ? body.links.openUrl : void 0
      } : void 0,
      metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : void 0
    });
    return res.status(created.idempotent ? 200 : 201).json({
      success: true,
      data: created.event,
      meta: {
        idempotent: created.idempotent
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create calendar event.";
    const isValidation = message.startsWith("Validation:");
    if (isValidation) {
      return res.status(400).json({
        success: false,
        error: message.replace("Validation:", "").trim()
      });
    }
    console.error("Failed to create calendar event:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create calendar event."
    });
  }
}

export { handler as h };
