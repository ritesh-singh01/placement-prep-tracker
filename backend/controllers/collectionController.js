const Collection = require("../models/collection");
const Note = require("../models/notes");

exports.getCollections = async (req, res) => {
  try {
    let collections = await Collection.find({ user: req.user._id }).sort({ createdAt: 1 });
    
    if (collections.length === 0) {
      // Provision default collections on the fly
      collections = await Collection.insertMany([
        { name: "General", user: req.user._id, icon: "sparkles", color: "muted", isDefault: true },
        { name: "Company-wise", user: req.user._id, icon: "building-2", color: "blue" },
        { name: "DSA", user: req.user._id, icon: "code-2", color: "good" },
        { name: "DBMS", user: req.user._id, icon: "database", color: "purple" },
        { name: "OS + CN", user: req.user._id, icon: "globe", color: "amber" },
      ]);
    } else {
      // Ensure at least one has isDefault: true
      const hasDefault = collections.some(c => c.isDefault);
      if (!hasDefault) {
        let defaultCol = collections.find(c => c.name === "General") || collections[0];
        if (defaultCol) {
          defaultCol.isDefault = true;
          await defaultCol.save();
        }
      }
    }
    
    res.status(200).json({ success: true, data: collections });
  } catch (err) {
    console.error("[Collection] Get Collections Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch collections" });
  }
};

exports.createCollection = async (req, res) => {
  try {
    const { name, color, icon } = req.body;
    const trimmedName = (name || "").trim();
    if (!trimmedName) {
      return res.status(400).json({ success: false, message: "Collection name is required" });
    }
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      return res.status(400).json({ success: false, message: "Collection name must be between 2 and 100 characters." });
    }
    if (/^[+-]?\d+(\.\d+)?$/.test(trimmedName)) {
      return res.status(400).json({ success: false, message: "Collection name cannot contain only numbers." });
    }
    if (!/^[a-zA-Z0-9\s&.\-']+$/.test(trimmedName)) {
      return res.status(400).json({ success: false, message: "Collection name contains invalid characters." });
    }
    if (!/[a-zA-Z0-9]/.test(trimmedName)) {
      return res.status(400).json({ success: false, message: "Collection name cannot consist only of special characters." });
    }

    const cColor = color || "muted";
    const cIcon = icon || "folder";

    const validColors = ["muted", "good", "blue", "purple", "amber", "bad"];
    const validIcons = ["folder", "code-2", "database", "globe", "building-2", "briefcase", "sparkles", "book"];

    if (!validColors.includes(cColor)) {
      return res.status(400).json({ success: false, message: "Invalid collection color." });
    }
    if (!validIcons.includes(cIcon)) {
      return res.status(400).json({ success: false, message: "Invalid collection icon." });
    }

    const collection = await Collection.create({
      name: trimmedName,
      color: cColor,
      icon: cIcon,
      user: req.user._id,
    });

    res.status(201).json({ success: true, data: collection });
  } catch (err) {
    console.error("[Collection] Create Collection Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to create collection" });
  }
};

exports.updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, icon } = req.body;

    const updateFields = {};

    if (name !== undefined) {
      const trimmedName = (name || "").trim();
      if (!trimmedName) {
        return res.status(400).json({ success: false, message: "Collection name is required." });
      }
      if (trimmedName.length < 2 || trimmedName.length > 100) {
        return res.status(400).json({ success: false, message: "Collection name must be between 2 and 100 characters." });
      }
      if (/^[+-]?\d+(\.\d+)?$/.test(trimmedName)) {
        return res.status(400).json({ success: false, message: "Collection name cannot contain only numbers." });
      }
      if (!/^[a-zA-Z0-9\s&.\-']+$/.test(trimmedName)) {
        return res.status(400).json({ success: false, message: "Collection name contains invalid characters." });
      }
      if (!/[a-zA-Z0-9]/.test(trimmedName)) {
        return res.status(400).json({ success: false, message: "Collection name cannot consist only of special characters." });
      }
      updateFields.name = trimmedName;
    }

    const validColors = ["muted", "good", "blue", "purple", "amber", "bad"];
    const validIcons = ["folder", "code-2", "database", "globe", "building-2", "briefcase", "sparkles", "book"];

    if (color !== undefined) {
      if (!validColors.includes(color)) {
        return res.status(400).json({ success: false, message: "Invalid collection color." });
      }
      updateFields.color = color;
    }

    if (icon !== undefined) {
      if (!validIcons.includes(icon)) {
        return res.status(400).json({ success: false, message: "Invalid collection icon." });
      }
      updateFields.icon = icon;
    }

    const collection = await Collection.findOneAndUpdate(
      { _id: id, user: req.user._id },
      updateFields,
      { new: true, runValidators: true }
    );

    if (!collection) {
      return res.status(404).json({ success: false, message: "Collection not found" });
    }

    res.status(200).json({ success: true, data: collection });
  } catch (err) {
    console.error("[Collection] Update Collection Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to update collection" });
  }
};

exports.deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await Collection.findOne({ _id: id, user: req.user._id });
    if (!collection) {
      return res.status(404).json({ success: false, message: "Collection not found" });
    }

    if (collection.isDefault || collection.name === "General") {
      return res.status(400).json({ success: false, message: "Cannot delete the default General collection" });
    }

    // Fallback notes to "General"
    const generalCol = await Collection.findOne({ isDefault: true, user: req.user._id }) || await Collection.findOne({ name: "General", user: req.user._id });
    if (generalCol) {
      await Note.updateMany(
        { collectionId: collection._id, user: req.user._id },
        { collectionId: generalCol._id }
      );
    }

    await collection.deleteOne();

    res.status(200).json({ success: true, message: "Collection deleted and notes moved to General" });
  } catch (err) {
    console.error("[Collection] Delete Collection Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to delete collection" });
  }
};
