'use client';

import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Article {
  id: string;
  title: string;
  category: string;
  readTime: string;
  icon: string;
  summary: string;
  content: string;
}

interface NeuroArticlesTabProps {
  articles: Article[];
}

export default function NeuroArticlesTab({ articles }: NeuroArticlesTabProps) {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {articles.map(art => (
          <div
            key={art.id}
            onClick={() => setSelectedArticle(art)}
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-3"
          >
            <div className="flex justify-between items-center">
              <span className="text-2xl">{art.icon}</span>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-slate-500 font-bold">
                {art.category} • {art.readTime}
              </span>
            </div>
            <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">{art.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
              {art.summary}
            </p>
            <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <span>مطالعه کامل مقاله</span>
              <ChevronLeft className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-xl w-full rounded-3xl p-6 shadow-2xl space-y-5 text-right max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedArticle.icon}</span>
                  <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">{selectedArticle.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {selectedArticle.content}
              </div>

              <button
                onClick={() => setSelectedArticle(null)}
                className="w-full py-3 bg-indigo-600 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                بستن خوانش
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}