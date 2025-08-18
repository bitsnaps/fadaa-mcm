const { Profile, sequelize } = require('../models');
const { Op } = require('sequelize');
const { handleRouteError } = require('../lib/errorHandler');

// Get all profiles
exports.getAllProfiles = async (c) => {
  try {
    const profiles = await Profile.findAll();
    return c.json(profiles);
  } catch (error) {
    return handleRouteError(c, 'Error fetching profiles', error);
  }
};

// Get the currently active profile
exports.getActiveProfile = async (c) => {
  try {
    const activeProfile = await Profile.findOne({ where: { is_active: true } });
    if (!activeProfile) {
      return c.json({ message: 'No active profile found.' }, 404);
    }
    return c.json(activeProfile);
  } catch (error) {
    return handleRouteError(c, 'Error fetching active profile', error);
  }
};

// Create a new profile
exports.createProfile = async (c) => {
  try {
    const { name, description } = await c.req.json();
    const countProfiles = await Profile.count();
    const newProfile = await Profile.create({
      name,
      description,
      is_active: countProfiles == 0,
    });
    return c.json(newProfile, 201);
  } catch (error) {
    return handleRouteError(c, 'Error creating profile', error);
  }
};

// Set a profile as the globally active one
exports.setActiveProfile = async (c) => {
  const { profileId } = c.req.param();
  const transaction = await sequelize.transaction();
  
  try {
    const profileToActivate = await Profile.findByPk(profileId, { transaction });
    if (!profileToActivate) {
      await transaction.rollback();
      return c.json({ message: 'Profile not found.' }, 404);
    }
    
    // Deactivate all profiles first
    await Profile.update({ is_active: false }, { where: {}, transaction });
    
    // Activate the target profile
    await profileToActivate.update({ is_active: true }, { transaction });
    
    await transaction.commit();
    return c.json({ message: 'Profile activated successfully.' });
  } catch (error) {
    await transaction.rollback();
    return handleRouteError(c, 'Error activating profile', error);
  }
};

// Update a profile's details
exports.updateProfile = async (c) => {
  try {
    const { profileId } = c.req.param();
    const { name, description } = await c.req.json();

    const profile = await Profile.findByPk(profileId);
    if (!profile) {
      return c.json({ message: 'Profile not found.' }, 404);
    }

    await profile.update({ name, description });
    return c.json(profile);
  } catch (error) {
    return handleRouteError(c, 'Error updating profile', error);
  }
};

// Delete a profile
exports.deleteProfile = async (c) => {
  try {
    const { profileId } = c.req.param();
    const profile = await Profile.findByPk(profileId);

    if (!profile) {
      return c.json({ message: 'Profile not found.' }, 404);
    }

    if (profile.is_active) {
      return c.json({ message: 'Cannot delete an active profile. Please activate another profile first.' }, 400);
    }

    // You might want to add logic here to handle what happens to entities associated with this profile
    await profile.destroy();
    return c.body(null, 204);
  } catch (error) {
    return handleRouteError(c, 'Error deleting profile', error);
  }
};