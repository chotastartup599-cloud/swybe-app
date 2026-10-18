import mongoose from 'mongoose';

const TestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Agar model pehle se bana hua hai toh use karo, warna naya banao
const Test = mongoose.models.Test || mongoose.model('Test', TestSchema);

export default Test;