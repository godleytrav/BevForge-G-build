import { d as db, e as endpointCurrent, t as tileEndpointBindings } from '../../../../index-BiQ9ukMS.js';
import { eq, inArray, sql } from 'drizzle-orm';

async function handler(req, res) {
  try {
    const { endpointId, tileId, nodeId, limit = "100", offset = "0" } = req.query;
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
    if (endpointId) {
      const endpointIdNum = parseInt(endpointId, 10);
      if (isNaN(endpointIdNum)) {
        return res.status(400).json({
          error: "Invalid endpointId parameter",
          message: "endpointId must be a number"
        });
      }
      const [current] = await db.select().from(endpointCurrent).where(eq(endpointCurrent.endpointId, endpointIdNum));
      if (!current) {
        return res.status(404).json({
          error: "Endpoint not found",
          message: `No current value found for endpoint ${endpointIdNum}`
        });
      }
      return res.status(200).json({
        data: [
          {
            endpointId: current.endpointId,
            timestamp: current.timestamp,
            valueBool: current.valueBool,
            valueNum: current.valueNum,
            valueString: current.valueString,
            valueJson: current.valueJson,
            quality: current.quality,
            source: current.source
          }
        ],
        meta: {
          total: 1,
          limit: limitNum,
          offset: 0,
          count: 1
        }
      });
    }
    if (tileId) {
      const tileIdNum = parseInt(tileId, 10);
      if (isNaN(tileIdNum)) {
        return res.status(400).json({
          error: "Invalid tileId parameter",
          message: "tileId must be a number"
        });
      }
      const bindings = await db.select({ endpointId: tileEndpointBindings.endpointId }).from(tileEndpointBindings).where(eq(tileEndpointBindings.tileId, tileIdNum));
      const endpointIds = bindings.map((b) => b.endpointId);
      if (endpointIds.length === 0) {
        return res.status(200).json({
          data: [],
          meta: {
            total: 0,
            limit: limitNum,
            offset: offsetNum,
            count: 0
          }
        });
      }
      const currentValues2 = await db.select().from(endpointCurrent).where(inArray(endpointCurrent.endpointId, endpointIds));
      const data2 = currentValues2.map((cv) => ({
        endpointId: cv.endpointId,
        timestamp: cv.timestamp,
        valueBool: cv.valueBool,
        valueNum: cv.valueNum,
        valueString: cv.valueString,
        valueJson: cv.valueJson,
        quality: cv.quality,
        source: cv.source
      }));
      return res.status(200).json({
        data: data2,
        meta: {
          total: data2.length,
          limit: limitNum,
          offset: offsetNum,
          count: data2.length
        }
      });
    }
    if (nodeId) {
      const nodeIdNum = parseInt(nodeId, 10);
      if (isNaN(nodeIdNum)) {
        return res.status(400).json({
          error: "Invalid nodeId parameter",
          message: "nodeId must be a number"
        });
      }
      const { hardwareEndpoints } = await import('../../../../index-BiQ9ukMS.js').then(n => n.o);
      const endpoints = await db.select({ id: hardwareEndpoints.id }).from(hardwareEndpoints).where(eq(hardwareEndpoints.nodeId, nodeIdNum));
      const endpointIds = endpoints.map((ep) => ep.id);
      if (endpointIds.length === 0) {
        return res.status(200).json({
          data: [],
          meta: {
            total: 0,
            limit: limitNum,
            offset: offsetNum,
            count: 0
          }
        });
      }
      const currentValues2 = await db.select().from(endpointCurrent).where(inArray(endpointCurrent.endpointId, endpointIds)).limit(limitNum).offset(offsetNum);
      const data2 = currentValues2.map((cv) => ({
        endpointId: cv.endpointId,
        timestamp: cv.timestamp,
        valueBool: cv.valueBool,
        valueNum: cv.valueNum,
        valueString: cv.valueString,
        valueJson: cv.valueJson,
        quality: cv.quality,
        source: cv.source
      }));
      return res.status(200).json({
        data: data2,
        meta: {
          total: endpointIds.length,
          limit: limitNum,
          offset: offsetNum,
          count: data2.length
        }
      });
    }
    const currentValues = await db.select().from(endpointCurrent).limit(limitNum).offset(offsetNum);
    const [{ count: totalCount }] = await db.select({ count: sql`count(*)` }).from(endpointCurrent);
    const data = currentValues.map((cv) => ({
      endpointId: cv.endpointId,
      timestamp: cv.timestamp,
      valueBool: cv.valueBool,
      valueNum: cv.valueNum,
      valueString: cv.valueString,
      valueJson: cv.valueJson,
      quality: cv.quality,
      source: cv.source
    }));
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
    console.error("Error fetching latest telemetry:", error);
    res.status(500).json({
      error: "Internal server error",
      message: String(error)
    });
  }
}

export { handler as h };
