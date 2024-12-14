const jwt = require('jsonwebtoken');
const generateTokens = async (user) => {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.ACCESS_TOKEN_SECRET_KEY,
    { expiresIn: '15m' },
  );

  const refreshToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.REFRESH_TOKEN_SECRET_KEY,
    { expiresIn: '7d' },
  );

  return { accessToken, refreshToken };
};

module.exports = { generateTokens };
