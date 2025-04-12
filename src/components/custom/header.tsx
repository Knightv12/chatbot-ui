import { ThemeToggle } from "./theme-toggle";
import { User } from '../../interfaces/interfaces';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

export function Header({ user, onLogout }: HeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 pl-16 border-b">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold">Math Learning Assistant</h1>
      </div>
      <div className="flex items-center space-x-4">
        <ThemeToggle />
        {user && (
          <>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {user.role === 'teacher' ? 'Teacher' : 'Student'}: {user.username}
            </span>
            <button
              onClick={onLogout}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}