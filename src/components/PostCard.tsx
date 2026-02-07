import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";

import { formatDistanceToNow } from "date-fns";
import { deletePost } from "../api/codeleap";
import type { Post } from '../api/codeleap'
import PostForm from "./PortForm";
import { Icon } from "@iconify/react";


type Page = { results: Post[]; next: string | null; previous: string | null; count: number };

function useFocusTrap(ref: React.RefObject<HTMLDivElement | null>, active: boolean) {
    useEffect(() => {
        if (!active || !ref.current) return;

        const el = ref.current;
        const previouslyFocused = document.activeElement as HTMLElement | null;

        // Focus first focusable element
        const focusable = el.querySelectorAll<HTMLElement>(
            'input, button, textarea, select, a[href], [tabindex]:not([tabindex="-1"])'
        );
        focusable[0]?.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Tab") return;
            const focusableEls = el.querySelectorAll<HTMLElement>(
                'input, button, textarea, select, a[href], [tabindex]:not([tabindex="-1"])'
            );
            const first = focusableEls[0];
            const last = focusableEls[focusableEls.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            previouslyFocused?.focus();
        };
    }, [ref, active]);
}

function PostCard({ post, currentUsername }: { post: Post; currentUsername: string }) {

    const isOwner = post.username === currentUsername;
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);

    const deleteDialogRef = useRef<HTMLDivElement>(null);
    const editDialogRef = useRef<HTMLDivElement>(null);

    useFocusTrap(deleteDialogRef, deleteOpen);
    useFocusTrap(editDialogRef, editOpen);

    // Close modals on Escape
    const handleEscape = useCallback((e: KeyboardEvent) => {
        if (e.key === "Escape") {
            if (deleteOpen) setDeleteOpen(false);
            if (editOpen) setEditOpen(false);
        }
    }, [deleteOpen, editOpen]);

    useEffect(() => {
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [handleEscape]);

    const qc = useQueryClient();

    const del = useMutation({
        mutationFn: () => deletePost(post.id),

        onMutate: async () => {
            await qc.cancelQueries({ queryKey: ["posts"] });

            const prev = qc.getQueryData<InfiniteData<Page>>(["posts"]);

            qc.setQueryData<InfiniteData<Page>>(["posts"], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((p) => ({
                        ...p,
                        results: p.results.filter((x) => x.id !== post.id),
                    })),
                };
            });

            return { prev };
        },

        onError: (_err, _vars, ctx) => {
            if (ctx?.prev) qc.setQueryData(["posts"], ctx.prev);
        },

        onSuccess: () => setDeleteOpen(false),

        onSettled: () => {
            qc.invalidateQueries({ queryKey: ["posts"] });
        },
    });

    const createdDate = new Date(post.created_datetime);

    return (
        <article className='flex flex-col rounded-xl' aria-labelledby={`post-title-${post.id}`}>
            <header className='flex bg-customblue px-6 py-4 border-customblue border rounded-t-xl justify-between'>
                <div>
                    <h2 id={`post-title-${post.id}`} className='font-semibold text-[1.350rem] text-secondary'>
                        {post.title}
                    </h2>
                </div>
                {isOwner && (
                    <div className='flex gap-4' role="group" aria-label={`Actions for post "${post.title}"`}>
                        <button
                            aria-label={`Delete post "${post.title}"`}
                            className="p-0 rounded hover:bg-white/10 focus:outline-2 focus:outline-white focus:outline-offset-2"
                            type="button"
                            onClick={() => setDeleteOpen(true)}
                        >
                            <Icon
                                icon="ic:baseline-delete-forever"
                                className="text-secondary"
                                width="28"
                                height="28"
                                aria-hidden="true"
                            />
                        </button>
                        <button
                            aria-label={`Edit post "${post.title}"`}
                            className="p-0 rounded hover:bg-white/10 focus:outline-2 focus:outline-white focus:outline-offset-2"
                            type="button"
                            onClick={() => setEditOpen(true)}
                        >
                            <Icon
                                icon="bx:bx-edit"
                                className="text-secondary"
                                width="28"
                                height="28"
                                aria-hidden="true"
                            />
                        </button>
                    </div>
                )}
            </header>
            <div className='p-6 gap-4 flex flex-col border-customgrey border rounded-b-xl'>
                <div className='flex justify-between text-muted'>
                    <span className='font-semibold'>@{post.username}</span>
                    <time dateTime={createdDate.toISOString()}>
                        {formatDistanceToNow(createdDate, { addSuffix: true })}
                    </time>
                </div>
                <div className='flex flex-col gap-4'>
                    {post.content.split("\n").map((line, i) => (
                        <p key={i}>{line}</p>
                    ))}
                </div>
            </div>

            {/* Delete Modal */}
            {deleteOpen && (
                <div className="fixed inset-0 z-50" role="presentation">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setDeleteOpen(false)}
                        aria-hidden="true"
                    />
                    <div className="relative z-10 min-h-full flex items-center justify-center p-4">
                        <div
                            ref={deleteDialogRef}
                            className="w-full max-w-xl rounded-lg bg-surface border border-border p-6"
                            role="alertdialog"
                            aria-modal="true"
                            aria-labelledby={`delete-dialog-title-${post.id}`}
                            aria-describedby={`delete-dialog-desc-${post.id}`}
                        >
                            <p
                                id={`delete-dialog-title-${post.id}`}
                                className="text-text font-semibold"
                            >
                                Are you sure you want to delete this item?
                            </p>
                            <p id={`delete-dialog-desc-${post.id}`} className="sr-only">
                                This will permanently delete the post titled "{post.title}".
                            </p>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    onClick={() => setDeleteOpen(false)}
                                    disabled={del.isPending}
                                    className="h-10 rounded-md border border-border px-5 text-sm text-text hover:bg-bg/40 disabled:opacity-60 focus:outline-2 focus:outline-customblue focus:outline-offset-2"
                                    type="button"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={() => del.mutate()}
                                    disabled={del.isPending}
                                    className="h-10 rounded-md bg-red-500 px-5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 focus:outline-2 focus:outline-red-500 focus:outline-offset-2"
                                    type="button"
                                    aria-busy={del.isPending}
                                >
                                    {del.isPending ? "Deleting..." : "Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editOpen && (
                <div className="fixed inset-0 z-50" role="presentation">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setEditOpen(false)}
                        aria-hidden="true"
                    />
                    <div className="relative z-10 min-h-full flex items-center justify-center p-4">
                        <div
                            ref={editDialogRef}
                            className="w-full max-w-xl"
                            role="dialog"
                            aria-modal="true"
                            aria-label={`Edit post "${post.title}"`}
                        >
                            <PostForm
                                mode="edit"
                                post={post}
                                onEdited={() => setEditOpen(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </article>
    )
}

export default PostCard