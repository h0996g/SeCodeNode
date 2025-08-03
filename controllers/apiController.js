const Entity = require("../models/entity");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const registerController = async (req, res) => {
  try {
    const { firstName, lastName, email, age, password, type } = req.body;
    if (type && type !== "student" && type !== "teacher") {
      throw new Error("Invalid entity type");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const entity = new Entity({
      firstName,
      lastName,
      email,
      age,
      password: hashedPassword,
      type,
      profileImage: req.file ? req.file.path : undefined, // undefined means use the default from schema
    });
    await entity.save();
    res.status(201).json({ message: "Entity registered successfully", entity });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: "email already exists" });
    } else if (error.name === "ValidationError") {
      res.status(400).json({ message: "Invalid entity data" });
    } else {
      res
        .status(500)
        .json({ message: "Error registering entity", error: error.message });
    }
  }
};

const authController = async (req, res) => {
  try {
    const { email, password } = req.body;
    const entity = await Entity.findOne({ email });
    if (!entity) {
      throw new Error("Entity not found");
    }
    const isPasswordCorrect = await bcrypt.compare(password, entity.password);
    if (!isPasswordCorrect) {
      throw new Error("Invalid password");
    }
    const token = jwt.sign(
      { id: entity._id, type: entity.type, email: entity.email },
      process.env.JWT_SECRET
    );
    res.status(200).json({
      message: "Entity authenticated successfully",
      token,
      user: {
        id: entity._id,
        type: entity.type,
        email: entity.email,
      },
    });
  } catch (error) {
    res.status(400).json({ message: "Invalid email or password" });
  }
};
const getEntity = async (req, res) => {
  try {
    const entity = await Entity.findById(req.user.id);
    res.status(200).json(entity);
  } catch (error) {
    res.status(400).json({ message: "Entity not found" });
  }
};
const getStudents = async (req, res) => {
  try {
    if (req.user.type !== "teacher") {
      throw new Error("unauthorized");
    }
    const students = await Entity.find({ type: "student" });
    res.status(200).json(students);
  } catch (error) {
    if (error.message === "unauthorized") {
      res.status(401).json({ message: "unauthorized" });
    } else {
      res.status(400).json({ message: "Students not found" });
    }
  }
};
const updateEntity = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.profileImage = req.file.path;
    }
    const updatedEntity = await Entity.findByIdAndUpdate(
      req.user.id,
      updateData,
      {
        runValidators: true,
        new: true,
      }
    );
    res.status(200).json(updatedEntity);
  } catch (error) {
    res.status(400).json({ message: "Entity not found" });
  }
};

module.exports = {
  registerController,
  authController,
  getEntity,
  getStudents,
  updateEntity,
};
