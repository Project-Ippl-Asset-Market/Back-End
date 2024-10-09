export const checkRole = (roles) => {
  return (req, res, next) => {
    const userRole = req.user.role; // Dapatkan role dari token/auth
    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
};
