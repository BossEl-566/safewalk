const EmergencyContact = require("../models/EmergencyContact");

async function createEmergencyContact(req, res) {
  try {
    const {
      name,
      phone,
      relationship,
      priority = 1,
      isPrimary = false,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Contact name is required.",
      });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: "Contact phone number is required.",
      });
    }

    if (!relationship || !relationship.trim()) {
      return res.status(400).json({
        success: false,
        message: "Relationship is required.",
      });
    }

    const contact = await EmergencyContact.create({
      name,
      phone,
      relationship,
      priority,
      isPrimary,
      status: "active",
    });

    return res.status(201).json({
      success: true,
      message: "Emergency contact created successfully.",
      data: contact,
    });
  } catch (error) {
    console.error("Create emergency contact error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create emergency contact.",
      error: error.message,
    });
  }
}

async function getEmergencyContacts(req, res) {
  try {
    const contacts = await EmergencyContact.find({ status: "active" }).sort({
      isPrimary: -1,
      priority: 1,
      createdAt: -1,
    });

    return res.json({
      success: true,
      count: contacts.length,
      data: contacts,
    });
  } catch (error) {
    console.error("Get emergency contacts error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch emergency contacts.",
      error: error.message,
    });
  }
}

async function getEmergencyContactById(req, res) {
  try {
    const contact = await EmergencyContact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Emergency contact not found.",
      });
    }

    return res.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error("Get emergency contact by id error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch emergency contact.",
      error: error.message,
    });
  }
}

async function updateEmergencyContact(req, res) {
  try {
    const { name, phone, relationship, priority, isPrimary, status } = req.body;

    const contact = await EmergencyContact.findByIdAndUpdate(
      req.params.id,
      {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(relationship !== undefined && { relationship }),
        ...(priority !== undefined && { priority }),
        ...(isPrimary !== undefined && { isPrimary }),
        ...(status !== undefined && { status }),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Emergency contact not found.",
      });
    }

    return res.json({
      success: true,
      message: "Emergency contact updated successfully.",
      data: contact,
    });
  } catch (error) {
    console.error("Update emergency contact error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update emergency contact.",
      error: error.message,
    });
  }
}

async function deleteEmergencyContact(req, res) {
  try {
    const contact = await EmergencyContact.findByIdAndUpdate(
      req.params.id,
      {
        status: "inactive",
      },
      {
        new: true,
      }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Emergency contact not found.",
      });
    }

    return res.json({
      success: true,
      message: "Emergency contact deleted successfully.",
    });
  } catch (error) {
    console.error("Delete emergency contact error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete emergency contact.",
      error: error.message,
    });
  }
}

module.exports = {
  createEmergencyContact,
  getEmergencyContacts,
  getEmergencyContactById,
  updateEmergencyContact,
  deleteEmergencyContact,
};