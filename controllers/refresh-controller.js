const { generateTokens } = require('../utils');
const jwt = require('jsonwebtoken');
const { prisma } = require('../prisma/prisma-client');

const refreshController = {
  refresh: async (req, res) => {
    const { refreshToken } = req.body;
    console.log(refreshToken);
    // FIXME: странная логика проверки и генирации, почему токен постоянно один и тот же

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token is required' });
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET_KEY);
      const user = await prisma.user.findUnique({
        where: {
          id: decoded.userId,
        },
      });

      if (!user) {
        return res.status(403).json({ error: 'Invalid refresh token' });
      }

      const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user);

      res.json({ accessToken, refreshToken: newRefreshToken });
    } catch (error) {
      console.log('Error [REFRESH_TOKEN]', error);
      res.status(403).json({ error: 'Invalid refresh token' });
    }
  },
};

module.exports = refreshController;
