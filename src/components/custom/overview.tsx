import { motion } from 'framer-motion';
import { MessageCircle, BotIcon } from 'lucide-react';
import FlipWordsDemo from '@/components/ui/flip-words-demo';

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-3xl w-full mx-auto md:mt-12"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.3 }}
    >
      <div className="rounded-xl bg-neutral-50/30 dark:bg-neutral-900/20 p-8 flex flex-col gap-8 leading-relaxed text-center max-w-xl mx-auto">
        <div className="flex flex-row justify-center gap-4 items-center">
          <BotIcon size={44} className="text-neutral-700 dark:text-neutral-300"/>
          <span className="text-neutral-500 dark:text-neutral-400">+</span>
          <MessageCircle size={44} className="text-neutral-700 dark:text-neutral-300"/>
        </div>
        <FlipWordsDemo />
      </div>
    </motion.div>
  );
};
