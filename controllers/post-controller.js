const { prisma } = require('../prisma/prisma-client');

const PostController = {
  createPost: async (req, res) => {
    const { content } = req.body;
    const authorId = req.user.userId;

    if (!content) {
      return res.status(400).json({ error: 'Текст поста обязателен' });
    }

    let filepath;
    if (req.file && req.file.path) {
      filepath = req.file.path;
      return res.status(400).json({ error: 'Текст поста обязателен' });
    }

    try {
      const createdPost = await prisma.post.create({
        data: {
          content,
          imageUrl: filepath ? `/${filepath}` : undefined,
          authorId,
        },
      });
      res.json(createdPost);
    } catch (error) {
      console.log('Error [CREATE_POST]', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  getAllPosts: async (req, res) => {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;
    try {
      const posts = await prisma.post.findMany({
        include: {
          author: true,
          likes: true,
          comments: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: Number((page - 1) * perPage),
        take: Number(perPage),
      });

      const postWithLikeInfo = posts.map((post) => ({
        ...post,
        isLiked: post.likes.some((like) => like.userId === userId),
      }));

      const totalPosts = await prisma.post.count();
      const totalPages = Math.ceil(totalPosts / perPage);

      res.json({
        data: postWithLikeInfo,
        currentPage: page,
        totalPages: totalPages,
      });
    } catch (error) {
      console.log('Error [GET_ALL_POSTS]', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  getPostById: async (req, res) => {
    const userId = req.user.userId;
    const postId = req.params.id;

    try {
      const post = await prisma.post.findUnique({
        where: {
          id: postId,
        },
        include: {
          author: true,
          likes: true,
          comments: {
            include: {
              user: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!post) {
        return res.status(404).json({ error: 'Пост не найден' });
      }

      const postWithLikeInfo = {
        ...post,
        isLiked: post.likes.some((like) => like.userId === userId),
      };

      return res.json(postWithLikeInfo);
    } catch (error) {
      console.log('Error [GET_POST_BY_ID]', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  deletePost: async (req, res) => {
    const id = req.params.id;
    const userId = req.user.userId;
    try {
      const findPost = await prisma.post.findUnique({
        where: {
          id,
        },
      });

      if (!findPost) {
        return res.status(404).json({ error: 'Пост не найден' });
      }

      if (userId !== findPost.authorId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const transaction = await prisma.$transaction([
        prisma.comment.deleteMany({ where: { postId: id } }),
        prisma.like.deleteMany({ where: { postId: id } }),
        prisma.post.delete({ where: { id } }),
      ]);

      res.json(transaction);
    } catch (error) {
      console.log('Error [DELETE_POST]', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

module.exports = PostController;
