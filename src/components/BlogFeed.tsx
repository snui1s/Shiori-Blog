import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getOptimizedImageUrl } from "../lib/images";

interface Post {
  id: number | string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  category: string;
  imageUrl?: string | null;
  image?: string | null; // API alias
  createdAt: Date | string;
  author: string;
}

interface BlogFeedProps {
  initialPosts: Post[];
  allCategories: string[];
  initialTotalPages: number;
}

export default function BlogFeed({
  initialPosts,
  allCategories,
  initialTotalPages,
}: BlogFeedProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(initialTotalPages);

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  const fetchPosts = useCallback(async () => {
    // Only skip the fetch on the very first mount if filters are empty
    if (isInitialMount.current && !search && !category && page === 1) {
      isInitialMount.current = false;
      return;
    }
    isInitialMount.current = false;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        category,
        page: page.toString(),
        limit: "12",
      });

      const res = await fetch(`/api/posts?${params.toString()}`);
      if (!res.ok) throw new Error("Fetch failed");

      const data = await res.json();
      setPosts(data.posts);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, category, page]);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPosts();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchPosts]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full">
      {/* Search & Filter Header using Tailwind */}
      <div className="mb-24 flex justify-center relative z-50">
        <div className="w-full max-w-[850px]">
          <div className="flex flex-col md:flex-row gap-4 p-2 bg-white/2 border border-white/5 rounded-4xl glass-premium">
            {/* Search Input */}
            <div className="flex-1 flex items-center bg-black/20 rounded-3xl overflow-hidden pr-2 transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/30 focus-within:bg-black/40">
              <input
                type="text"
                placeholder="ค้นหาเรื่องที่สนใจ..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1); // Reset page on search
                }}
                className="flex-1 py-4 px-6 bg-transparent border-none text-white outline-none text-base font-medium placeholder:text-white/20"
              />
              <div className="bg-primary text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
            </div>

            {/* Custom React Dropdown */}
            <div
              className="relative w-full md:min-w-[200px] md:w-auto"
              ref={dropdownRef}
            >
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full h-full min-h-[56px] py-4 pl-6 pr-12 bg-black/20 rounded-3xl text-white text-left font-bold relative transition-all duration-300 hover:bg-black/30 cursor-pointer flex items-center justify-between md:min-w-[220px]"
              >
                <span className="truncate block max-w-[150px] mr-2 text-sm md:text-base">
                  {category || "หมวดหมู่ทั้งหมด"}
                </span>
                <div
                  className={`absolute right-[1.2rem] top-1/2 -translate-y-1/2 text-primary pointer-events-none transition-transform duration-300 ${dropdownOpen ? "rotate-180" : ""}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 9 6 6 6-6"></path>
                  </svg>
                </div>
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-[calc(100%+8px)] right-0 left-0 min-w-[220px] max-h-[300px] overflow-y-auto p-2 flex flex-col gap-1 z-100 shadow-[0_10px_40px_rgba(0,0,0,0.5)] bg-[#1a1a1a] rounded-3xl border border-white/10 origin-top"
                  >
                    <div
                      onClick={() => {
                        setCategory("");
                        setPage(1);
                        setDropdownOpen(false);
                      }}
                      className="px-4 py-3 rounded-xl text-sm font-bold text-text-muted hover:text-white hover:bg-white/5 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      หมวดหมู่ทั้งหมด
                      {category === "" && (
                        <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_#f63049]"></div>
                      )}
                    </div>
                    {allCategories.map((cat) => (
                      <div
                        key={cat}
                        onClick={() => {
                          setCategory(cat);
                          setPage(1);
                          setDropdownOpen(false);
                        }}
                        className="px-4 py-3 rounded-xl text-sm font-bold text-text-muted hover:text-white hover:bg-white/5 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        {cat}
                        {category === cat && (
                          <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_#f63049]"></div>
                        )}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 transition-opacity duration-300`}
      >
        {loading ? (
          /* Skeleton View */
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="group post-card glass-premium flex flex-col overflow-hidden rounded-4xl border border-white/5 relative"
            >
              <div className="w-full aspect-video md:aspect-16/10 bg-white/5 skeleton" />
              <div className="p-8 flex flex-col flex-1 gap-4">
                <div className="skeleton skeleton-text w-20" />
                <div className="skeleton skeleton-heading" />
                <div className="skeleton skeleton-text" />
                <div className="skeleton skeleton-text w-2/3" />
                <div className="pt-8 mt-6 border-t border-white/5 flex justify-between">
                  <div className="skeleton skeleton-text w-24" />
                  <div className="skeleton skeleton-text w-20" />
                </div>
              </div>
            </div>
          ))
        ) : posts.length > 0 ? (
          posts.map((post, index) => (
            <motion.article
              key={post.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: Math.min(index * 0.1, 0.5) }}
              className="group post-card glass-premium flex flex-col overflow-hidden rounded-4xl transition-all duration-500 hover:-translate-y-2 hover:border-primary/30 border border-white/5 hover:shadow-[0_20px_40px_rgba(246,48,73,0.1)] relative"
            >
              <a
                href={`/blog/${post.slug}`}
                className="block w-full aspect-video md:aspect-16/10 overflow-hidden bg-white/5 relative cursor-pointer skeleton"
              >
                {post.image ? (
                  <img
                    src={getOptimizedImageUrl(post.image, 600)}
                    alt={post.title}
                    width={600}
                    height={375}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white/5 text-text-muted">
                    No Image
                  </div>
                )}
              </a>
              <div className="p-8 flex flex-col flex-1">
                <span className="text-primary font-bold text-xs uppercase tracking-widest mb-3">
                  {post.category}
                </span>
                <h2 className="text-xl md:text-2xl font-bold mb-4 leading-snug">
                  <a
                    href={`/blog/${post.slug}`}
                    className="text-white no-underline transition-colors hover:text-primary"
                  >
                    {post.title}
                  </a>
                </h2>
                <p className="post-excerpt text-text-muted text-sm leading-relaxed line-clamp-2 mt-auto">
                  {post.excerpt}
                </p>
                <div className="pt-8 mt-6 border-t border-white/5 flex justify-between items-center text-xs text-text-muted/60 font-medium">
                  <span>
                    {new Date(post.createdAt).toLocaleDateString("th-TH", {
                      timeZone: "Asia/Bangkok",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-primary rounded-full" />
                    {post.author}
                  </span>
                </div>
              </div>
            </motion.article>
          ))
        ) : (
          <div className="col-span-full text-center py-24 text-text-muted">
            {!loading && "ไม่พบบันทึกที่ค้นหา..."}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-20 flex justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary transition-all cursor-pointer min-w-[120px]"
          >
            ← ก่อนหน้า
          </button>
          <span className="flex items-center px-4 font-bold text-white/50">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary transition-all cursor-pointer min-w-[120px]"
          >
            ถัดไป →
          </button>
        </div>
      )}
    </div>
  );
}
