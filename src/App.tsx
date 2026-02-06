import { useInfiniteQuery } from "@tanstack/react-query"
import { listPosts } from "./api/codeleap"
import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"

import Header from "./components/Header"
import PortForm from "./components/PortForm"
import PostCard from "./components/PostCard"
import UsernameModal from "./components/UsernameModal"

function App() {

  const [currentUsername, setCurrentUsername] = useState<string | null>(
    () => localStorage.getItem("username")
  );

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["posts"],
    queryFn: ({ pageParam }) => listPosts(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next ?? undefined,
    enabled: !!currentUsername,
  });

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sentinelRef.current) return;
    if (!hasNextPage) return;

    const el = sentinelRef.current;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { rootMargin: "600px" }
    );

    obs.observe(el);

    return () => obs.disconnect();

  }, [fetchNextPage, hasNextPage]);

  const posts = data?.pages.flatMap((p) => p.results) ?? [];

  return (
    <div className="min-h-screen bg-bg text-primary">
      <AnimatePresence>
        {!currentUsername && (
          <UsernameModal onSubmit={(username) => setCurrentUsername(username)} />
        )}
      </AnimatePresence>

      {currentUsername && (
        <div className="min-h-screen bg-surface max-w-3xl mx-auto flex flex-col">
          <Header />
          <main className="flex flex-col p-6 gap-6">
            <PortForm mode="create" username={currentUsername} onCreated={() => refetch()} />

            <AnimatePresence mode="wait">
              {isLoading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-lg border border-border bg-surface p-4"
                >
                  loading posts...
                </motion.div>
              )}

              {isError && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-lg border border-border bg-surface p-4"
                >
                  <p className="font-semibold">Error loading</p>
                  <p className="text-muted text-sm">{(error as Error).message}</p>
                </motion.div>
              )}

              {!isLoading && !isError && posts.length === 0 && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-lg border border-customgrey bg-surface p-4"
                >
                  There's no posts yet.
                </motion.div>
              )}

              {!isLoading && !isError && posts.length > 0 && (
                <motion.div
                  key="posts"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-6"
                >
                  {posts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.35,
                        delay: Math.min(index * 0.06, 0.6),
                      }}
                    >
                      <PostCard post={post} currentUsername={currentUsername} />
                    </motion.div>
                  ))}

                  {/* sentinel do infinite scroll */}
                  <div ref={sentinelRef} />

                  {isFetchingNextPage && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-muted text-sm py-2"
                    >
                      Carregando mais...
                    </motion.div>
                  )}

                  {!hasNextPage && posts.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-muted text-sm py-2"
                    >
                      Fim.
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      )}
    </div>
  )
}

export default App
