const { Profile, Client } = require('../models');
const { sequelize } = require('../models');

// Get all profiles for a specific client
exports.getClientProfiles = async (c) => {
  try {
    const { clientId } = c.req.param();
    const profiles = await Profile.findAll({ where: { client_id: clientId } });
    if (!profiles) {
      return c.json({ message: 'No profiles found for this client.' }, 404);
    }
    return c.json(profiles);
  } catch (error) {
    return c.json({ message: 'Error fetching client profiles', error: error.message }, 500);
  }
};

// Create a new profile for a client
exports.createProfile = async (c) => {
  try {
    const { clientId } = c.req.param();
    const { name, description } = await c.req.json();

    const client = await Client.findByPk(clientId);
    if (!client) {
      return c.json({ message: 'Client not found.' }, 404);
    }

    const newProfile = await Profile.create({
      name,
      description,
      client_id: clientId,
      is_active: false, // Profiles are never created as active by default
    });

    return c.json(newProfile, 201);
  } catch (error) {
    return c.json({ message: 'Error creating profile', error: error.message }, 500);
  }
};

// Set a specific profile to be the active one for a client
exports.setActiveProfile = async (c) => {
  const { profileId } = c.req.param();
  const transaction = await sequelize.transaction();

  try {
    const profileToActivate = await Profile.findByPk(profileId);
    if (!profileToActivate) {
      await transaction.rollback();
      return c.json({ message: 'Profile not found.' }, 404);
    }

    // Deactivate all other profiles for this client
    await Profile.update(
      { is_active: false },
      {
        where: {
          client_id: profileToActivate.client_id,
          id: { [sequelize.Op.ne]: profileId } // Op.ne means "not equal"
        },
        transaction
      }
    );

    // Activate the target profile
    await profileToActivate.update({ is_active: true }, { transaction });

    await transaction.commit();
    return c.json({ message: 'Profile activated successfully.' });
  } catch (error) {
    await transaction.rollback();
    return c.json({ message: 'Error activating profile', error: error.message }, 500);
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
    return c.json({ message: 'Error updating profile', error: error.message }, 500);
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
    return c.json({ message: 'Error deleting profile', error: error.message }, 500);
  }
};