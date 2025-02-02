export const chatInclude = {
  members: {
    select: {
      id: true,
      name: true,
      avatar: true,
    },
  },
  lastMessage: {
    include: {
      UserBase: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  },
};
