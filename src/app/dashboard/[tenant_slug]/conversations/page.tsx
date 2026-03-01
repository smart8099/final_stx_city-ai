"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Flex, IconButton, Icon } from "@chakra-ui/react";
import { FiDownload } from "react-icons/fi";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useConversations } from "@/lib/conversation-store";
import { useDepartments } from "@/lib/department-store";
import { useSettings } from "@/lib/settings-store";
import { useMacros } from "@/lib/macro-store";
import { Conversation, InternalNote, Message } from "@/lib/types";
import TicketSidebar, { ViewFilter } from "@/components/TicketSidebar";
import TicketTable from "@/components/TicketTable";
import TicketDetailPanel from "@/components/TicketDetailPanel";

export default function ConversationsPage() {
  const params = useParams();
  const slug = params.tenant_slug as string;
  const { user } = useUser();
  const myName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  const {
    conversations,
    getConversation,
    updateConversation,
    bulkUpdateConversations,
    addMessage,
    addNote,
    setTenantSlug,
  } = useConversations();
  const { setTenantSlug: setDeptTenantSlug } = useDepartments();
  const { setTenantSlug: setSettingsSlug } = useSettings();
  const { setTenantSlug: setMacroSlug } = useMacros();

  const [activeView, setActiveView] = useState<ViewFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<{ id: string; viewedAt: number }[]>([]);

  useEffect(() => {
    setTenantSlug(slug);
    setDeptTenantSlug(slug);
    setSettingsSlug(slug);
    setMacroSlug(slug);
  }, [slug, setTenantSlug, setDeptTenantSlug, setSettingsSlug, setMacroSlug]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeView, searchQuery]);

  // Filter out entries older than 24 hours
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  const recentlyViewedIds = useMemo(() => {
    const now = Date.now();
    return recentlyViewed
      .filter((rv) => now - rv.viewedAt < TWENTY_FOUR_HOURS)
      .map((rv) => rv.id);
  }, [recentlyViewed]);

  const handleSelectTicket = useCallback((id: string) => {
    setSelectedId(id);
    setRecentlyViewed((prev) => {
      const now = Date.now();
      const filtered = prev.filter((rv) => rv.id !== id && now - rv.viewedAt < TWENTY_FOUR_HOURS);
      return [{ id, viewedAt: now }, ...filtered];
    });
  }, []);

  const filtered = useMemo(() => {
    const sorted = [...conversations].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    if (activeView === "all") return sorted;

    // Quick views
    if (activeView === "view:mine") {
      return myName ? sorted.filter((c) => c.assignedTo === myName) : [];
    }
    if (activeView === "view:recent") {
      const idSet = new Set(recentlyViewedIds);
      return sorted.filter((c) => idSet.has(c.id));
    }

    // Status filter
    if (["new", "open", "escalated", "resolved"].includes(activeView)) {
      return sorted.filter((c) => c.status === activeView);
    }

    // Department filters
    if (activeView === "dept:unassigned") {
      return sorted.filter((c) => !c.department);
    }
    if (activeView.startsWith("dept:")) {
      const deptName = activeView.slice(5);
      return sorted.filter((c) => c.department === deptName);
    }

    return sorted;
  }, [conversations, activeView, myName, recentlyViewedIds]);

  const selectedConversation = selectedId ? getConversation(selectedId) || null : null;

  const handleStatusChange = useCallback((id: string, status: string) => {
    const updates: Partial<Conversation> = {
      status: status as "new" | "open" | "resolved" | "escalated",
      updatedAt: new Date().toISOString(),
    };
    if (status === "escalated") updates.wasEscalated = true;
    updateConversation(id, updates);
  }, [updateConversation]);

  const handleDepartmentChange = useCallback((id: string, department: string) => {
    updateConversation(id, {
      department: department || undefined,
      updatedAt: new Date().toISOString(),
    });
  }, [updateConversation]);

  const handlePriorityChange = useCallback((id: string, priority: string) => {
    updateConversation(id, {
      priority: priority as "low" | "normal" | "high" | "urgent",
      updatedAt: new Date().toISOString(),
    });
  }, [updateConversation]);

  const handleAssigneeChange = useCallback((id: string, assignee: string) => {
    updateConversation(id, {
      assignedTo: assignee || undefined,
      updatedAt: new Date().toISOString(),
    });
  }, [updateConversation]);

  const handleAddNote = useCallback((id: string, note: InternalNote) => {
    addNote(id, note);
  }, [addNote]);

  const handleAdminReply = useCallback((id: string, content: string) => {
    const msg: Message = {
      id: `msg-${Date.now()}-admin`,
      role: "assistant",
      content,
      timestamp: new Date().toISOString(),
    };
    addMessage(id, msg);
  }, [addMessage]);

  const handleBulkStatusChange = useCallback((ids: string[], status: string) => {
    const updates: Partial<Conversation> = {
      status: status as "new" | "open" | "resolved" | "escalated",
      updatedAt: new Date().toISOString(),
    };
    if (status === "escalated") updates.wasEscalated = true;
    bulkUpdateConversations(ids, updates);
    setSelectedIds([]);
  }, [bulkUpdateConversations]);

  const handleBulkPriorityChange = useCallback((ids: string[], priority: string) => {
    bulkUpdateConversations(ids, {
      priority: priority as "low" | "normal" | "high" | "urgent",
      updatedAt: new Date().toISOString(),
    });
    setSelectedIds([]);
  }, [bulkUpdateConversations]);

  const handleExportCSV = useCallback(() => {
    const rows = filtered.map((c) => {
      const subject = c.messages.find((m) => m.role === "user")?.content || "No subject";
      return [
        c.id,
        c.status,
        c.priority || "normal",
        c.department || "Unassigned",
        c.intent || "",
        `"${subject.replace(/"/g, '""')}"`,
        c.messages.length,
        c.startedAt,
        c.updatedAt,
      ].join(",");
    });
    const csv = ["ID,Status,Priority,Department,Intent,Subject,Messages,Created,Updated", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversations-${slug}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered, slug]);

  return (
    <Flex h="100vh" overflow="hidden">
      <TicketSidebar
        conversations={conversations}
        activeView={activeView}
        recentlyViewedIds={recentlyViewedIds}
        onViewChange={setActiveView}
      />
      {selectedConversation ? (
        <TicketDetailPanel
          conversation={selectedConversation}
          onBack={() => setSelectedId(null)}
          onStatusChange={handleStatusChange}
          onDepartmentChange={handleDepartmentChange}
          onPriorityChange={handlePriorityChange}
          onAssigneeChange={handleAssigneeChange}
          onAddNote={handleAddNote}
          onAdminReply={handleAdminReply}
        />
      ) : (
        <Flex flex={1} direction="column" overflow="hidden">
          {/* Export button row */}
          <Flex px={4} py={1.5} borderBottom="1px solid" borderColor="gray.100" justify="flex-end" bg="white">
            <IconButton
              aria-label="Export CSV"
              icon={<Icon as={FiDownload} />}
              size="xs"
              variant="ghost"
              color="gray.500"
              onClick={handleExportCSV}
            />
          </Flex>
          <TicketTable
            conversations={filtered}
            selectedId={selectedId}
            currentPage={currentPage}
            searchQuery={searchQuery}
            selectedIds={selectedIds}
            onPageChange={setCurrentPage}
            onSelect={handleSelectTicket}
            onSearchChange={setSearchQuery}
            onSelectionChange={setSelectedIds}
            onBulkStatusChange={handleBulkStatusChange}
            onBulkPriorityChange={handleBulkPriorityChange}
          />
        </Flex>
      )}
    </Flex>
  );
}
