import { ThemeToggle } from "./theme-toggle";


export const Header = () => {
  return (
    <>
      <header className="relative items-center justify-between p-2 sm:p-4 py-2 bg-background text-black dark:text-white w-full">
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
          <ThemeToggle />
        </div>
      </header>
    </>
  );
};