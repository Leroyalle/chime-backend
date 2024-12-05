const { prisma } = require('../prisma/prisma-client');
const bcrypt = require('bcryptjs');
const Jdenticon = require('jdenticon');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const UserController = {
  register: async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Все поля обязательны' });
    }

    try {
      const findUser = await prisma.user.findFirst({
        where: {
          email,
        },
      });

      if (findUser) {
        return res.status(400).json({ error: 'Пользователь уже существует' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const png = Jdenticon.toPng(name + Date.now(), 200);
      const avatarName = `${name.replace(' ', '')}_${Date.now() + Math.random()}.png`;
      const avatarPath = path.join(__dirname, '../uploads', avatarName);
      fs.writeFileSync(avatarPath, png);

      const createdUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          avatarUrl: `/uploads/${avatarName}`,
        },
      });

      res.json(createdUser);
    } catch (error) {
      console.log('Error [REGISTER_USER]', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  login: async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Все поля обязательны' });
    }
    try {
      const findUser = await prisma.user.findFirst({
        where: {
          email,
        },
      });

      if (!findUser) {
        return res.status(400).json({ error: 'Пользователь не найден' });
      }

      const isPasswordValid = await bcrypt.compare(password, findUser.password);

      if (!isPasswordValid) {
        return res.status(400).json({ error: 'Неверный логин или пароль' });
      }

      const token = jwt.sign({ userId: findUser.id }, process.env.SECRET_KEY);

      res.json({ token });
    } catch (error) {
      console.log('Error [LOGIN_USER]', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  getUserById: async (req, res) => {
    const id = req.params.id;
    const userId = req.user.userId;
    try {
      const findUser = await prisma.user.findUnique({
        where: { id },
        include: {
          followers: true,
          following: true,
        },
      });

      if (!findUser) {
        return res.status(400).json({ error: 'Пользователь не найден' });
      }

      const isFollowing = await prisma.follows.findFirst({
        where: {
          AND: [{ followerId: userId }, { followingId: findUser.id }],
        },
      });

      res.json({ ...findUser, isFollowing: !!isFollowing });
    } catch (error) {
      console.log('Error [GET_USER_BY_ID]', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  updateUser: async (req, res) => {
    const id = req.params.id;
    const userId = req.user.userId;

    const { email, name, password, dateOfBirth, bio, location } = req.body;

    let filepath;
    if (req.file && req.file.path) {
      filepath = req.file.path;
    }
    console.log(file?.path);

    if (id !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    try {
      if (email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email,
          },
        });

        if (existingUser && existingUser.id !== id) {
          return res.status(400).json({ error: 'Пользователь уже существует' });
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          email: email || undefined,
          name: name || undefined,
          password: password ? await bcrypt.hash(password, 10) : undefined,
          dateOfBirth: dateOfBirth || undefined,
          bio: bio || undefined,
          location: location || undefined,
          avatarUrl: filepath ? `/${filepath}` : undefined,
        },
      });

      res.json(updatedUser);
    } catch (error) {
      console.log('Error [UPDATE_USER]', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  current: async (req, res) => {
    const id = req.user.userId;

    try {
      const findUser = await prisma.user.findUnique({
        where: { id },
        include: {
          followers: {
            include: {
              follower: true,
            },
          },
          following: {
            include: {
              following: true,
            },
          },
        },
      });

      if (!findUser) {
        return res.status(400).json({ error: 'Пользователь не найден' });
      }

      res.json(findUser);
    } catch (error) {
      console.log('Error [CURRENT_USER]', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

module.exports = UserController;
