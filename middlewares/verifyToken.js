const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  console.log("Verifying token...");
  console.log("Authorization header:", req.headers.authorization);
  if (!req.headers.authorization) {
    
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    console.log("No token provided");
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};
module.exports = verifyToken;
