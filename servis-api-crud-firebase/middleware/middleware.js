// /middleware/authMiddleware.js
const checkRole = (roles) => {
  return (req, res, next) => {
    const userRole = req.user.role;  
    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
};

export default checkRole;
