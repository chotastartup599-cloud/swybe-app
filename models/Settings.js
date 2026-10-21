import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
  classes: [{ type: String }],
  exams: [{ type: String }],
  subjects: [{ type: String }],
  streams: [{ type: String }],
  hobbies: [{ type: String }],
}, { timestamps: true });

const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
export default Settings;