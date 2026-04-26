import { h as hardwareEndpoints, d as db, e as endpointCurrent } from '../../../index-BiQ9ukMS.js';
import { eq, and, sql, inArray } from 'drizzle-orm';

async function handler(req, res) {
  try {
    const { nodeId, kind, include, limit = "100", offset = "0" } = req.query;
    const limitNum = parseInt(limit, 10);
    const offsetNum = parseInt(offset, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 1e3) {
      return res.status(400).json({
        error: "Invalid limit parameter",
        message: "Limit must be between 1 and 1000"
      });
    }
    if (isNaN(offsetNum) || offsetNum < 0) {
      return res.status(400).json({
        error: "Invalid offset parameter",
        message: "Offset must be >= 0"
      });
    }
    const validKinds = [
      "DI",
      "DO",
      "AI",
      "AO",
      "PWM",
      "I2C",
      "SPI",
      "UART",
      "1WIRE",
      "MODBUS",
      "VIRTUAL"
    ];
    if (kind && !validKinds.includes(kind)) {
      return res.status(400).json({
        error: "Invalid kind parameter",
        message: `Kind must be one of: ${validKinds.join(", ")}`
      });
    }
    const conditions = [];
    if (nodeId) {
      const nodeIdNum = parseInt(nodeId, 10);
      if (isNaN(nodeIdNum)) {
        return res.status(400).json({
          error: "Invalid nodeId parameter",
          message: "nodeId must be a number"
        });
      }
      conditions.push(eq(hardwareEndpoints.controllerId, nodeIdNum));
    }
    if (kind) {
      conditions.push(eq(hardwareEndpoints.endpointKind, kind));
    }
    let query = db.select().from(hardwareEndpoints);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    query = query.limit(limitNum).offset(offsetNum);
    const endpoints = await query;
    const countQuery = conditions.length > 0 ? db.select({ count: sql`count(*)` }).from(hardwareEndpoints).where(and(...conditions)) : db.select({ count: sql`count(*)` }).from(hardwareEndpoints);
    const [{ count: totalCount }] = await countQuery;
    let data = endpoints.map((ep) => ({
      id: ep.id,
      controllerId: ep.controllerId,
      endpointKind: ep.endpointKind,
      channelId: ep.channelId,
      direction: ep.direction,
      valueType: ep.valueType,
      unit: ep.unit,
      invert: ep.invert,
      rangeMin: ep.rangeMin,
      rangeMax: ep.rangeMax,
      status: ep.status,
      lastRead: ep.lastRead,
      lastWrite: ep.lastWrite
    }));
    if (include === "current") {
      const endpointIds = endpoints.map((ep) => ep.id);
      if (endpointIds.length > 0) {
        const currentValues = await db.select().from(endpointCurrent).where(inArray(endpointCurrent.endpointId, endpointIds));
        const currentMap = new Map(
          currentValues.map((cv) => [
            cv.endpointId,
            {
              timestamp: cv.timestamp,
              valueBool: cv.valueBool,
              valueNum: cv.valueNum,
              valueString: cv.valueString,
              valueJson: cv.valueJson,
              quality: cv.quality,
              source: cv.source
            }
          ])
        );
        data = data.map((ep) => ({
          ...ep,
          current: currentMap.get(ep.id) || null
        }));
      }
    }
    res.status(200).json({
      data,
      meta: {
        total: Number(totalCount),
        limit: limitNum,
        offset: offsetNum,
        count: data.length
      }
    });
  } catch (error) {
    console.error("Error fetching endpoints:", error);
    const message = String(error);
    if (message.includes("no such table") || message.includes("relation") || message.includes("does not exist") || message.includes("ECONNREFUSED")) {
      return res.status(200).json({
        data: [],
        meta: {
          total: 0,
          limit: 0,
          offset: 0,
          count: 0
        }
      });
    }
    res.status(500).json({
      error: "Internal server error",
      message
    });
  }
}

export { handler as h };
