type Task = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

type Note = {
  id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

type Goal = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

type CollectionResponse<T> = {
  success: boolean;
  data: T;
};

type MutationResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

type MessageResponse = {
  success: boolean;
  message: string;
};

export type {
  CollectionResponse,
  Goal,
  MessageResponse,
  MutationResponse,
  Note,
  Task,
};
