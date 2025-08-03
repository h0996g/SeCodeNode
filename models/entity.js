const mongoose = require("mongoose");

const entitySchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  age: { type: Number },
  password: { type: String, required: true },
  type: { type: String, default: "student" },
 profileImage: { 
    type: String, 
    default: "uploads/default_profile.jpeg" 
  },
});

const Entity = mongoose.model("Entity", entitySchema);

module.exports = Entity;
