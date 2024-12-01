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
    }

    try {
      const createdPost = await prisma.post.create({
        data: {
          content,
          imageUrl: filepath ? `/${filepath}` : undefined,
          authorId,
        },
      });

      console.log(createdPost);

      res.json(createdPost);
    } catch (error) {
      console.log('Error [CREATE_POST]', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  getAllPosts: async (req, res) => {
    const userId = req.user.userId;
    const { skip = 0, take = 10 } = req.query;
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
        skip: Number(skip),
        take: Number(take),
      });

      const postWithLikeInfo = posts.map((post) => ({
        ...post,
        isLiked: post.likes.some((like) => like.userId === userId),
      }));

      res.json(postWithLikeInfo);
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
