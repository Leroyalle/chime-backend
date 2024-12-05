const { prisma } = require('../prisma/prisma-client');

const CommentController = {
  createComment: async (req, res) => {
    const { userId } = req.user;
    const { postId, content } = req.body;
    if (!content || !postId) {
      return res.status(400).json({ error: 'Все поля обязательны' });
    }

    try {
      const comment = await prisma.comment.create({
        data: {
          content,
          postId,
          userId,
        },
        include: {
          user: true,
        },
      });

      res.json(comment);
    } catch (error) {
      console.log('Error [CREATE_COMMENT]', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  deleteComment: async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
      const findComment = await prisma.comment.findUnique({ where: { id } });

      if (!findComment) {
        return res.status(404).json({ error: 'Комментарий не найден' });
      }

      if (findComment.userId !== userId) {
        return res.status(403).json({ error: 'Вы не авторизованы для удаления этого комментария' });
      }

      await prisma.comment.delete({ where: { id: findComment.id } });

      res.json(findComment);
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

module.exports = CommentController;
