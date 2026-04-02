module.exports = function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.auth_user || !allowedRoles.includes(req.auth_user.role)) {
      return res.status(403).json({ message: 'Akses ditolak: role tidak memiliki izin' });
    }
    next();
  };
};
