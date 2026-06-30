"use client";

import { StorySlide, StoryBadge, LastFmLogo } from "./StorySlide";
import type { WrappedData } from "@/store/wrapped";
import { motion } from "framer-motion";

const TAG_ACCENTS = [
  "#d51007",
  "#c23a1a",
  "#b5502d",
  "#a06030",
  "#e8802a",
  "#d4722e",
  "#c26838",
  "#b35e35",
  "#d51007",
  "#e86030",
  "#cc4820",
  "#d51007",
];

export function TopTagsSlide({ data, slideIndex = 0 }: { data: WrappedData; slideIndex?: number }) {
  const { topTags } = data;
  const tags = topTags.slice(0, 12);
  const maxCount = tags[0]?.count || 1;

  return (
    <StorySlide bg="#111" slideIndex={slideIndex}>
      <div className="flex items-center justify-between mb-2">
        <LastFmLogo />
        <StoryBadge>Genres</StoryBadge>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-5"
        >
          <p className="text-[10px] text-white/30 font-semibold uppercase tracking-[0.15em]">
            Your musical DNA
          </p>
        </motion.div>

        {/* Tags as flowing text — hashtag style */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap gap-x-3 gap-y-2"
        >
          {tags.map((tag, i) => {
            const ratio = tag.count / maxCount;
            const size = 12 + ratio * 10;
            const opacity = 0.35 + ratio * 0.55;
            return (
              <motion.span
                key={tag.name}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.04 }}
                className="font-bold leading-tight"
                style={{
                  fontSize: `${size}px`,
                  color: TAG_ACCENTS[i % TAG_ACCENTS.length],
                  opacity,
                }}
              >
                #{tag.name}
              </motion.span>
            );
          })}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <p className="text-white/15 text-[10px]">
          {tags.length} genres define your taste
        </p>
      </motion.div>
    </StorySlide>
  );
}