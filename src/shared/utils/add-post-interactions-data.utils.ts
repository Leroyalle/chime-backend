import { Bookmark, Like, Comment, Post, Tag, UserBase, Image } from '@prisma/client';

type PostWithRelations = Post & {
  likes: Like[];
  bookmarks: Bookmark[];
  comments: Comment[];
  author: UserBase;
  tags: Tag[];
  images: Image[];
};

type ReturnPost = PostWithRelations & {
  isLiked: boolean;
  isBookmarked: boolean;
  likesCount: number;
  commentsCount: number;
};

export const addPostInteractionsData = (post: PostWithRelations, userId: string): ReturnPost => ({
  ...post,
  isLiked: post.likes.some((like) => like.userId === userId),
  isBookmarked: post.bookmarks.some((bookmark) => bookmark.userId === userId),
  likesCount: post.likes.length,
  commentsCount: post.comments.length,
});
