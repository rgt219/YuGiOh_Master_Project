import { useState, useEffect } from 'react';
import { API_URLS } from '@/config';

export function useCompetitiveDiscussion() {
    const [threads, setThreads] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTag, setSelectedTag] = useState("ALL");
    const [mediaUrlInput, setMediaUrlInput] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");
    const [newTag, setNewTag] = useState("META");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        fetchThreads();
    }, []);

    const fetchThreads = async () => {
        setIsLoading(true);
        try {
            const baseUrl = API_URLS?.FORUMS || API_URLS?.DECK || '';
            const response = await fetch(`${baseUrl}/api/forums/threads?category=competitive`);
            if (response.ok) {
                const data = await response.json();
                setThreads(data);
            } else {
                setThreads(getMockCompetitiveThreads());
            }
        } catch (error) {
            console.warn("API Offline, loading fallback mock competitive threads:", error);
            setThreads(getMockCompetitiveThreads());
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

        const baseUrl = API_URLS?.FORUMS || API_URLS?.DECK || '';

        if (selectedFile) {
            setIsUploading(true);
            const formData = new FormData();
            formData.append("file", selectedFile);

            try {
                const uploadRes = await fetch(`${baseUrl}/api/forums/upload`, {
                    method: "POST",
                    body: formData
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    uploadedMediaUrls.push(uploadData.url);
                } else {
                    alert("⚠️ Failed to upload media to Azure Blob Storage.");
                    setIsSubmitting(false);
                    setIsUploading(false);
                    return;
                }
            } catch (uploadErr) {
                console.error("Blob Upload error:", uploadErr);
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
            category: "competitive",
            tag: newTag,
            title: newTitle,
            content: newContent,
            author: user.userName || "CompetitiveDuelist",
            mediaUrls: uploadedMediaUrls,
            createdAt: new Date().toISOString()
        };

        try {
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
            console.error("Failed to publish competitive thread:", err);
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
            alert("⚠️ ACCESS DENIED: You must be logged in to create a thread!");
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

function getMockCompetitiveThreads() {
    return [
        {
            id: "comp-1",
            title: "Top 8 YCS Deck Report: Pure Snake-Eye Matchup Breakdown & Side Deck Guide",
            content: "Detailed walkthrough of 11 tournament rounds, going first vs going second patterns, and key Handtrap priorities.",
            author: "ProYGO_Prodigy",
            tag: "TOURNAMENT",
            upvotes: 114,
            commentCount: 42,
            createdAt: "2026-08-05T12:00:00Z"
        },
        {
            id: "comp-2",
            title: "Is Ghost Mourner underrated in the current tier 1 format?",
            content: "Comparing Ghost Mourner & Moonlit Chill against Effect Veiler for main deck utility against turn 0 combos.",
            author: "MetaAnalyst",
            tag: "SIDE DECK",
            upvotes: 67,
            commentCount: 23,
            createdAt: "2026-08-06T15:30:00Z"
        },
        {
            id: "comp-3",
            title: "Advanced Chain Links: Resolving Trigger Effects on Summon during Opponent Turn",
            content: "A judge guide explaining Priority, Turn Player optional triggers vs Non-Turn Player mandatory triggers.",
            author: "HeadJudgeAlex",
            tag: "RULINGS",
            upvotes: 95,
            commentCount: 19,
            createdAt: "2026-08-07T08:15:00Z"
        }
    ];
}