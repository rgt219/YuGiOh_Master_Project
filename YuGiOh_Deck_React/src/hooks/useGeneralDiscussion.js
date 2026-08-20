import { useState, useEffect } from 'react';
import { API_URLS } from '../config';

export function useGeneralDiscussion() {
    const [threads, setThreads] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTag, setSelectedTag] = useState("ALL");
    const [mediaUrlInput, setMediaUrlInput] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");
    const [newTag, setNewTag] = useState("GENERAL");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        fetchThreads();
    }, []);

    const fetchThreads = async () => {
        setIsLoading(true);
        try {
            const baseUrl = API_URLS?.FORUMS || API_URLS?.DECK || "";
            const response = await fetch(`${baseUrl}/api/forums/threads?category=general`);
            if (response.ok) {
                const data = await response.json();
                setThreads(data);
            } else {
                setThreads(getMockThreads());
            }
        } catch (error) {
            console.warn("API Offline, loading mock forum data:", error);
            setThreads(getMockThreads());
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateThread = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const token = sessionStorage.getItem("token");
        const user = JSON.parse(sessionStorage.getItem("user") || "{}");
        let uploadedMediaUrls = [];

        if (selectedFile) {
            setIsUploading(true);
            const formData = new FormData();
            formData.append("file", selectedFile);

            try {
                const baseUrl = API_URLS?.FORUMS || "";
                const uploadRes = await fetch(`${baseUrl}/api/forums/upload`, {
                    method: "POST",
                    body: formData
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    uploadedMediaUrls.push(uploadData.url);
                } else {
                    alert("⚠️ Failed to upload file to Azure Blob Storage.");
                    setIsSubmitting(false);
                    setIsUploading(false);
                    return;
                }
            } catch (uploadErr) {
                console.error("Upload error:", uploadErr);
                alert("⚠️ Error uploading media file.");
                setIsSubmitting(false);
                setIsUploading(false);
                return;
            } finally {
                setIsUploading(false);
            }
        } else if (mediaUrlInput.trim()) {
            uploadedMediaUrls.push(mediaUrlInput.trim());
        }

        const threadPayload = {
            category: "general",
            tag: newTag,
            title: newTitle,
            content: newContent,
            author: user.userName || "AnonymousDuelist",
            mediaUrls: uploadedMediaUrls,
            createdAt: new Date().toISOString()
        };

        try {
            const baseUrl = API_URLS?.FORUMS || "";
            const response = await fetch(`${baseUrl}/api/forums/threads`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(threadPayload)
            });

            if (response.ok) {
                const createdThread = await response.json();
                setThreads([createdThread, ...threads]);
            }
        } catch (err) {
            console.error("Failed to publish thread:", err);
        } finally {
            setIsSubmitting(false);
            setShowModal(false);
            setNewTitle("");
            setNewContent("");
            setMediaUrlInput("");
            setSelectedFile(null);
        }
    };

    const handleUpvote = (threadId, e) => {
        e.preventDefault();
        setThreads(threads.map(t => t.id === threadId ? { ...t, upvotes: t.upvotes + 1 } : t));
    };

    const getLoggedInUser = () => {
        if (typeof window === 'undefined') return null;
        const user = sessionStorage.getItem("user");
        return user ? JSON.parse(user) : null;
    };

    const handleOpenCreateModal = () => {
        const user = getLoggedInUser();
        if (!user || !user.userName) {
            alert("ACCESS DENIED: You must be logged in to create a thread!");
            return;
        }
        setShowModal(true);
    };

    const filteredThreads = threads.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              t.author.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTag = selectedTag === "ALL" || t.tag === selectedTag;
        return matchesSearch && matchesTag;
    });

    return {
        threads, isLoading, searchTerm, setSearchTerm, selectedTag, setSelectedTag,
        mediaUrlInput, setMediaUrlInput, showModal, setShowModal, newTitle, setNewTitle,
        newContent, setNewContent, newTag, setNewTag, isSubmitting, selectedFile,
        setSelectedFile, isUploading, handleCreateThread, handleOpenCreateModal,
        handleUpvote, filteredThreads
    };
}

function getMockThreads() {
    return [
        {
            id: "1",
            title: "What are your hot takes on the upcoming Master Duel Banlist?",
            content: "With the new format approaching, do you think Snake-Eye will finally get hit directly or will splashable tech cards take the hit?",
            author: "KaibaCorpDev",
            tag: "GENERAL",
            upvotes: 42,
            commentCount: 18,
            createdAt: "2026-08-01T14:22:00Z"
        },
        {
            id: "2",
            title: "Yu-Gi-Oh! World Championship 2026 Dates Announced!",
            content: "Official tournament stream schedule and meta deck breakdown is now live on Konami's main portal.",
            author: "YGO_Reporter",
            tag: "NEWS",
            upvotes: 89,
            commentCount: 34,
            createdAt: "2026-08-03T09:15:00Z"
        },
        {
            id: "3",
            title: "Does Nibiru activate if field has 5 special summons during same chain?",
            content: "Need clarification on a weird ruling I encountered in my local tournament match yesterday.",
            author: "RookieDuelist",
            tag: "RULINGS",
            upvotes: 12,
            commentCount: 7,
            createdAt: "2026-08-04T18:40:00Z"
        }
    ];
}