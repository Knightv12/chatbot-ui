export interface message{
    content:string;
    role: "user" | "assistant";
    id:string;
}

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