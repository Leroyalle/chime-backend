const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  UserController,
  PostController,
  CommentController,
  LikeController,
  FollowController,
  RefreshController,
} = require('../controllers');

const authenticateToken = require('../middleware/auth');

const destination = 'uploads';

const storage = multer.diskStorage({
  destination,
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const uploads = multer({ storage });

// user
router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.get('/current', authenticateToken, UserController.current);
router.get('/users/:id', authenticateToken, UserController.getUserById);
router.put('/users/:id', authenticateToken, uploads.single('avatar'), UserController.updateUser);

// post
router.post('/posts', authenticateToken, uploads.single('postImage'), PostController.createPost);
router.get('/posts', authenticateToken, PostController.getAllPosts);
router.get('/posts/:id', authenticateToken, PostController.getPostById);
router.delete('/posts/:id', authenticateToken, PostController.deletePost);

// comment
router.post('/comments', authenticateToken, CommentController.createComment);
router.delete('/comments/:id', authenticateToken, CommentController.deleteComment);

// likes
router.post('/likes', authenticateToken, LikeController.likePost);
router.delete('/likes/:id', authenticateToken, LikeController.unlikePost);

// follow
router.post('/follow', authenticateToken, FollowController.followUser);
router.delete('/follow/:id', authenticateToken, FollowController.unFollowUser);
// FIXME: unFollow to follow

// refresh
router.post('/refresh', RefreshController.refresh);

module.exports = router;
