import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { InfiniteData } from "@tanstack/react-query";
import { createPost, patchPost } from "../api/codeleap";
import type { Post } from "../api/codeleap";

type Page = { results: Post[]; next: string | null; previous: string | null; count: number };

type Props =
    | { mode?: "create"; username: string; onCreated?: () => void; post?: undefined; onEdited?: undefined }
    | { mode: "edit"; post: Post; onEdited?: () => void; username?: undefined; onCreated?: undefined };

function PortForm(props: Props) {
    const isEdit = props.mode === "edit";
    const formId = isEdit ? `edit-form-${props.post.id}` : "create-form";

    const [title, setTitle] = useState(isEdit ? props.post.title : "");
    const [content, setContent] = useState(isEdit ? props.post.content : "");

    const qc = useQueryClient();

    const createMutation = useMutation({
        mutationFn: () =>
            createPost({ username: props.username!, title: title.trim(), content: content.trim() }),
        onSuccess: async () => {
            setTitle("");
            setContent("");
            await qc.invalidateQueries({ queryKey: ["posts"] });
            props.onCreated?.();
        },
    });

    const editMutation = useMutation({
        mutationFn: () =>
            patchPost(isEdit ? props.post.id : 0, {
                title: title.trim(),
                content: content.trim(),
            }),

        onMutate: async () => {
            if (!isEdit) return;
            await qc.cancelQueries({ queryKey: ["posts"] });

            const prev = qc.getQueryData<InfiniteData<Page>>(["posts"]);

            qc.setQueryData<InfiniteData<Page>>(["posts"], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((p) => ({
                        ...p,
                        results: p.results.map((x) =>
                            x.id === props.post.id
                                ? { ...x, title: title.trim(), content: content.trim() }
                                : x
                        ),
                    })),
                };
            });

            return { prev };
        },

        onError: (_err, _vars, ctx) => {
            if (ctx?.prev) qc.setQueryData(["posts"], ctx.prev);
        },

        onSuccess: () => {
            props.onEdited?.();
        },

        onSettled: () => {
            qc.invalidateQueries({ queryKey: ["posts"] });
        },
    });

    const mutation = isEdit ? editMutation : createMutation;
    const isValid = title.trim().length > 0 && content.trim().length > 0;

    return (
        <div className="flex flex-col bg-surface border-customgrey rounded-xl border py-4 px-4">
            <div>
                <h2 id={`${formId}-heading`} className="font-bold text-[1.375rem]">
                    {isEdit ? "Edit item" : "What's on your mind?"}
                </h2>
            </div>
            <div className="mt-6">
                <form
                    className="gap-6 flex flex-col"
                    aria-labelledby={`${formId}-heading`}
                    onSubmit={(e) => {
                        e.preventDefault();
                        mutation.mutate();
                    }}
                >
                    <fieldset className="flex flex-col">
                        <label htmlFor={`${formId}-title`}>Title</label>
                        <input
                            id={`${formId}-title`}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Hello world"
                            className="border-customgrey text-[0.875rem] border rounded-md py-1 px-2 focus:outline-2 focus:outline-customblue focus:outline-offset-1"
                            aria-required="true"
                        />
                    </fieldset>
                    <fieldset className="flex flex-col">
                        <label htmlFor={`${formId}-content`}>Content</label>
                        <textarea
                            id={`${formId}-content`}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Content here"
                            className="border-customgrey text-[0.875rem] border rounded-md py-1 px-2 focus:outline-2 focus:outline-customblue focus:outline-offset-1"
                            aria-required="true"
                            rows={4}
                        />
                    </fieldset>
                    <fieldset className="flex justify-end gap-3 items-center">
                        {mutation.isError && (
                            <span
                                className="text-sm text-red-400"
                                role="alert"
                            >
                                {(mutation.error as Error).message}
                            </span>
                        )}

                        {isEdit && (
                            <button
                                type="button"
                                onClick={() => props.onEdited?.()}
                                disabled={mutation.isPending}
                                className="border border-border text-text font-semibold py-1.5 px-9 rounded-md hover:bg-bg/40 disabled:opacity-60 focus:outline-2 focus:outline-customblue focus:outline-offset-2"
                            >
                                Cancel
                            </button>
                        )}

                        <button
                            type="submit"
                            disabled={!isValid || mutation.isPending}
                            className="bg-customblue text-secondary font-semibold py-1.5 px-9 rounded-md disabled:text-secondary/50 disabled:cursor-not-allowed focus:outline-2 focus:outline-customblue focus:outline-offset-2"
                            aria-disabled={!isValid || mutation.isPending}
                            aria-busy={mutation.isPending}
                        >
                            {mutation.isPending
                                ? isEdit
                                    ? "Saving..."
                                    : "Creating..."
                                : isEdit
                                    ? "Save"
                                    : "Create"}
                        </button>
                    </fieldset>
                </form>
            </div>
        </div>
    );
}

export default PortForm;