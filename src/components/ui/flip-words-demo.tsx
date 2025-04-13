import { FlipWords } from "@/components/ui/flip-words";

export default function FlipWordsDemo() {
  const words = ["Future", "Smart", "Modern", "Efficient"];

  return (
    <div className="flex justify-center items-center px-4 py-6">
      <div className="text-2xl md:text-3xl lg:text-4xl mx-auto font-normal text-neutral-600 dark:text-neutral-400 text-center">
        <div className="flex flex-wrap justify-center items-center gap-x-2">
          <span>Build</span>
          <FlipWords 
            words={words} 
            className="min-w-[4ch] text-center"
            duration={2000}
          />
        </div>
        <div className="mt-2">Chatbot & Learning Platform</div>
      </div>
    </div>
  );
} 