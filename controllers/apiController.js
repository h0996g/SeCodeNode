const Entity = require("../models/entity");
const Course = require("../models/lesson");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
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

const createCourse = async (req, res) => {
  try {
    // Check if user is a teacher
    console.log("User type:", req.user);
    if (req.user.type !== "teacher") {
      return res
        .status(403)
        .json({ message: "Only teachers can create lessons" });
    }

    const { title, description } = req.body;

    // Validate required fields
    if (!title || !description) {
      return res
        .status(400)
        .json({ message: "Title and description are required" });
    }

    // Validate title and description lengths
    if (title.trim().length < 3) {
      return res
        .status(400)
        .json({ message: "Title must be at least 3 characters long" });
    }

    if (description.trim().length < 10) {
      return res
        .status(400)
        .json({ message: "Description must be at least 10 characters long" });
    }

    const course = new Course({
      title: title.trim(),
      description: description.trim(),
      image: req.file ? req.file.path : null,
      teacherId: req.user.id,
    });

    await course.save();

    // Populate teacher info for response
    await course.populate("teacherId", "firstName lastName email");

    res.status(201).json({
      message: "Course created successfully",
      course,
      imageUrl: req.file ? `/uploads/${path.basename(req.file.path)}` : null
    });
  } catch (error) {
    // Clean up uploaded file if course creation fails
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }
    
    res.status(500).json({
      message: "Error creating lesson",
      error: error.message,
    });
  }
};


const getCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("teacherId", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching courses",
      error: error.message,
    });
  }
};

const getTeacherCourses = async (req, res) => {
  try {
    // Check if user is a teacher
    if (req.user.type !== "teacher") {
      return res
        .status(403)
        .json({ message: "Only teachers can access this endpoint" });
    }

    const courses = await Course.find({ teacherId: req.user.id })
      .populate("teacherId", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching teacher courses",
      error: error.message,
    });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description } = req.body;

    // Check if user is a teacher
    if (req.user.type !== "teacher") {
      return res
        .status(403)
        .json({ message: "Only teachers can update courses" });
    }

    // Find the course and check if it belongs to the teacher
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.teacherId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You can only update your own courses" });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (req.file) updateData.image = req.file.path;

    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      updateData,
      { new: true, runValidators: true }
    ).populate("teacherId", "firstName lastName email");

    res.status(200).json({
      message: "Course updated successfully",
      course: updatedCourse,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating course",
      error: error.message,
    });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check if user is a teacher
    if (req.user.type !== "teacher") {
      return res
        .status(403)
        .json({ message: "Only teachers can delete courses" });
    }

    // Find the course and check if it belongs to the teacher
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.teacherId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You can only delete your own courses" });
    }

    await Course.findByIdAndDelete(courseId);

    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting course",
      error: error.message,
    });
  }
};

module.exports = {
  registerController,
  authController,
  getEntity,
  getStudents,
  updateEntity,
  createCourse,
  getCourses,
  getTeacherCourses,
  updateCourse,
  deleteCourse,
};
