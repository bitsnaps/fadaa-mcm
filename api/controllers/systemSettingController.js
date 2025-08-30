const { SystemSetting } = require('../models');

const defaultSettings = {
  siteName: 'FADAA Platform',
  siteLogo: '/logo.png',
  defaultTheme: 'light',
  smtpHost: 'smtp.fadaa.dz',
  smtpPort: 587,
  smtpUser: 'user@fadaa.dz',
  smtpPassword: '',
  googleMaps: '',
  openAI: '',
  openAIBaseUrl: 'https://api.openai.com/v1',
};

exports.getSettings = async (c) => {
  try {
    const settings = await SystemSetting.findAll();
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    const combinedSettings = { ...defaultSettings, ...settingsMap };
    return c.json(combinedSettings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return c.json({ error: 'Failed to fetch settings' }, 500);
  }
};

exports.updateSettings = async (c) => {
  try {
    const newSettings = await c.req.json();
    const settingPromises = Object.entries(newSettings).map(([key, value]) => {
      return SystemSetting.upsert({ key, value: String(value) });
    });

    await Promise.all(settingPromises);
    return c.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    return c.json({ error: 'Failed to update settings' }, 500);
  }
};