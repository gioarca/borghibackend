const generateTokenPayload = (user, roleOverride = null) => {
  if (!user || !user._id) {
    throw new Error("generateTokenPayload: invalid user object");
  }

  return {
    id: user._id,
    role: roleOverride || user.role || "user", // default finale più sicuro
  };
};

module.exports = generateTokenPayload;
