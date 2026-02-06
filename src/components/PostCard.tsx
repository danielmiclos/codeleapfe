import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";

import { formatDistanceToNow } from "date-fns";
import { deletePost } from "../api/codeleap";
import type { Post } from '../api/codeleap'
import PostForm from "./PortForm";
import { Icon } from "@iconify/react";


type Page = { results: Post[]; next: string | null; previous: string | null; count: number };


function PostCard({ post, currentUsername }: { post: Post; currentUsername: string }) {

    const isOwner = post.username === currentUsername;
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);

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

    return (
        <div className='flex flex-col rounded-xl'>
            <header className='flex bg-customblue px-6 py-4 border-customblue border rounded-t-xl justify-between'>
                <div>
                    <h2 className='font-semibold text-[1.350rem] text-secondary'>{post.title}</h2>
                </div>
                {isOwner && (
                    <div className='flex gap-4'>
                        <button
                            aria-label="Delete"
                            className="p-0 rounded hover:bg-white/10"
                            type="button"
                            onClick={() => setDeleteOpen(true)}
                        >
                            <Icon
                                icon="ic:baseline-delete-forever"
                                className="text-secondary"
                                width="28"
                                height="28"
                            />
                        </button>
                        <button
                            aria-label="Edit"
                            className="p-0 rounded hover:bg-white/10"
                            type="button"
                            onClick={() => setEditOpen(true)}
                        >
                            <Icon icon="bx:bx-edit" className="text-secondary" width="28" height="28" />
                        </button>
                    </div>
                )}
            </header>
            <div className='p-6 gap-4 flex flex-col border-customgrey border rounded-b-xl'>
                <div className='flex justify-between text-muted'>
                    <div className='font-semibold'>@{post.username}</div>
                    <div>{formatDistanceToNow(new Date(post.created_datetime), { addSuffix: true })}</div>
                </div>
                <div className='flex flex-col gap-4'>
                    {post.content.split("\n").map((line, i) => (
                        <p key={i}>{line}</p>
                    ))}
                </div>
            </div>

            {/* Modal de Delete */}
            {deleteOpen && (
                <div className="fixed inset-0 z-50">
                    <button className="absolute inset-0 bg-black/50" onClick={() => setDeleteOpen(false)} type="button" />
                    <div className="relative z-10 min-h-full flex items-center justify-center p-4">
                        <div className="w-full max-w-xl rounded-lg bg-surface border border-border p-6">
                            <p className="text-text font-semibold">Are you sure you want to delete this item?</p>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    onClick={() => setDeleteOpen(false)}
                                    disabled={del.isPending}
                                    className="h-10 rounded-md border border-border px-5 text-sm text-text hover:bg-bg/40 disabled:opacity-60"
                                    type="button"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={() => del.mutate()}
                                    disabled={del.isPending}
                                    className="h-10 rounded-md bg-red-500 px-5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                                    type="button"
                                >
                                    {del.isPending ? "Deleting..." : "Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Edit */}
            {editOpen && (
                <div className="fixed inset-0 z-50">
                    <button className="absolute inset-0 bg-black/50" onClick={() => setEditOpen(false)} type="button" />
                    <div className="relative z-10 min-h-full flex items-center justify-center p-4">
                        <div className="w-full max-w-xl">
                            <PostForm
                                mode="edit"
                                post={post}
                                onEdited={() => setEditOpen(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PostCard