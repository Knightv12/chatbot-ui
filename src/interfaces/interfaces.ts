export type WolframContent = {
  text?: string[];
  images?: { title: string; url: string }[];
};

export type message = {
  role: "user" | "assistant";
  content: string | WolframContent;
  id: string;
};

export interface User {
  id: string;
  _id?: string;
  username: string;
  email: string;
  role: 'teacher' | 'student';
}

export interface Review {
  _id: string;
  teacher: User | string;
  student: User | string;
  content: string;
  rating: number;
  createdAt: string;
}

export interface TeacherStudent {
  _id: string;
  teacher: User | string;
  student: User | string;
  createdAt: string;
}