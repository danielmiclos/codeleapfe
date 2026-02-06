export type Post = {
    id: number;
    username: string;
    created_datetime: string;
    title: string;
    content: string;
}

export type Paginated<T> = {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

const BASE_URL = "https://dev.codeleap.co.uk/careers/";

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {

    const res = await fetch(input, {
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...(init?.headers ?? {}),
        },
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    }

    return res.json() as Promise<T>;
}

export function listPosts(url?: string) {
    return request<Paginated<Post>>(url ?? `${BASE_URL}`);
}

export function createPost(data: { username: string; title: string; content: string }) {
    return request<Post>(`${BASE_URL}`, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export function patchPost(id: number, data: { title: string; content: string }) {
    return request<Post>(`${BASE_URL}${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
    });
}

export function deletePost(id: number) {
    return request<void>(`${BASE_URL}${id}/`, { method: "DELETE" });
}