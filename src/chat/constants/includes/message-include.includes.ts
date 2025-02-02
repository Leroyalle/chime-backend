export const messageInclude = {
  post: {
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      images: true,
    },
  },
  UserBase: {
    select: {
      id: true,
      name: true,
      avatar: true,
    },
  },
};
