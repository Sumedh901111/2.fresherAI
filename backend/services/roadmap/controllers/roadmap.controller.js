
import mongoose from "mongoose";
import redis from "../../../shared/redis/redis.js";
import graph from "../graph/roadmap.graph.js";
import Roadmap from "../models/roadmap.model.js";

// Generate a new roadmap
export const generateRoadmap = async (req, res) => {
  try {
    const {
      role,
      targetPackage,
      useResume = false,
      resume,
    } = req.body;

    const userId = req.headers["x-user-id"];

    // Validate authenticated user
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: "Valid authenticated user is required.",
      });
    }

    // Validate required inputs
    if (
      typeof role !== "string" ||
      !role.trim() ||
      targetPackage === undefined ||
      targetPackage === null ||
      targetPackage === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Role and Target Package are required.",
      });
    }

    if (useResume && !resume) {
      return res.status(400).json({
        success: false,
        message: "Resume data is required.",
      });
    }

    // Generate roadmap using the graph
    const result = await graph.invoke({
      role: role.trim(),
      targetPackage,
      useResume,
      resume,
    });

    if (!result?.roadmap) {
      throw new Error("The roadmap generator returned no roadmap data.");
    }

    // Save roadmap to MongoDB
    const roadmap = await Roadmap.create({
      userId,
      ...result.roadmap,
    });

    // Cache the generated roadmap
    await redis.set(
      `roadmap:${roadmap._id}`,
      JSON.stringify(roadmap),
      "EX",
      60 * 60
    );

    // Invalidate this user's roadmap list cache
    await redis.del(`userRoadmaps:${userId}`);

    return res.status(201).json({
      success: true,
      message: "Roadmap generated successfully.",
      data: roadmap,
    });
  } catch (error) {
    console.error("Generate roadmap error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate roadmap.",
    });
  }
};

// Get all roadmaps for the authenticated user
export const getAllRoadmap = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: "Valid authenticated user is required.",
      });
    }

    const cacheKey = `userRoadmaps:${userId}`;
    const cache = await redis.get(cacheKey);

    if (cache) {
      return res.status(200).json({
        success: true,
        fromCache: true,
        data: JSON.parse(cache),
      });
    }

    const roadmaps = await Roadmap.find({ userId }).sort({
      createdAt: -1,
    });

    await redis.set(
      cacheKey,
      JSON.stringify(roadmaps),
      "EX",
      60 * 60
    );

    return res.status(200).json({
      success: true,
      fromCache: false,
      data: roadmaps,
    });
  } catch (error) {
    console.error("Get all roadmaps error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch roadmaps.",
    });
  }
};

// Get a specific roadmap by ID
export const getRoadmapbyId = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers["x-user-id"];

    // Reject invalid IDs, including "favicon.ico", before querying MongoDB
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid roadmap ID.",
      });
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: "Valid authenticated user is required.",
      });
    }

    // Check ownership in the database before returning cached data.
    // This prevents another user's cached roadmap from being exposed.
    const roadmap = await Roadmap.findOne({
      _id: id,
      userId,
    });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: "Roadmap not found.",
      });
    }

    const cacheKey = `roadmap:${id}`;
    const cache = await redis.get(cacheKey);

    if (cache) {
      const cachedRoadmap = JSON.parse(cache);

      // Only return the cached document if it belongs to this user.
      if (String(cachedRoadmap.userId) === String(userId)) {
        return res.status(200).json({
          success: true,
          fromCache: true,
          data: cachedRoadmap,
        });
      }
    }

    await redis.set(
      cacheKey,
      JSON.stringify(roadmap),
      "EX",
      60 * 60
    );

    return res.status(200).json({
      success: true,
      fromCache: false,
      data: roadmap,
    });
  } catch (error) {
    console.error("Get roadmap by ID error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch roadmap.",
    });
  }
};
