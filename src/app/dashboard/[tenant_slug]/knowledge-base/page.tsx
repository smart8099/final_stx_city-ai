"use client";

import { useState, useRef } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Icon,
  Button,
  Input,
  Textarea,
  Badge,
  Flex,
  Select,
  IconButton,
  Divider,
} from "@chakra-ui/react";
import {
  FiUpload,
  FiFile,
  FiPlus,
  FiTrash2,
  FiCheck,
  FiClock,
  FiBook,
} from "react-icons/fi";
import { DEPARTMENTS } from "@/lib/types";

interface Document {
  id: string;
  name: string;
  department: string;
  type: "pdf" | "txt";
  status: "ingested" | "processing" | "failed";
  size: string;
  uploadedAt: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  department: string;
}

const SEED_DOCS: Document[] = [];

const SEED_FAQS: FAQ[] = [];

const STATUS_CONFIG = {
  ingested: { color: "green", icon: FiCheck, label: "Ingested" },
  processing: { color: "yellow", icon: FiClock, label: "Processing" },
  failed: { color: "red", icon: FiTrash2, label: "Failed" },
};

export default function KnowledgeBasePage() {
  const [documents, setDocuments] = useState<Document[]>(SEED_DOCS);
  const [faqs, setFaqs] = useState<FAQ[]>(SEED_FAQS);
  const [dragOver, setDragOver] = useState(false);
  const [showFaqForm, setShowFaqForm] = useState(false);
  const [newFaq, setNewFaq] = useState({ question: "", answer: "", department: DEPARTMENTS[0] as string });
  const [filterDept, setFilterDept] = useState("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const uploadFiles = async (files: File[]) => {
    const validFiles = files.filter(
      (f) => f.name.endsWith(".pdf") || f.name.endsWith(".txt")
    );
    if (validFiles.length === 0) return;

    for (const file of validFiles) {
      const docId = `d-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const dept = filterDept !== "all" ? filterDept : DEPARTMENTS[0];

      // Add as processing
      const newDoc: Document = {
        id: docId,
        name: file.name,
        department: dept,
        type: file.name.endsWith(".pdf") ? "pdf" : "txt",
        status: "processing",
        size: formatSize(file.size),
        uploadedAt: new Date().toISOString().split("T")[0],
      };
      setDocuments((prev) => [newDoc, ...prev]);

      // Upload to API
      const formData = new FormData();
      formData.append("file", file);
      formData.append("department", dept);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          setDocuments((prev) =>
            prev.map((d) => (d.id === docId ? { ...d, status: "ingested" as const } : d))
          );
        } else {
          setDocuments((prev) =>
            prev.map((d) => (d.id === docId ? { ...d, status: "failed" as const } : d))
          );
        }
      } catch {
        setDocuments((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, status: "failed" as const } : d))
        );
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    uploadFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      uploadFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const handleAddFaq = () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) return;
    const faq: FAQ = {
      id: `f-${Date.now()}`,
      ...newFaq,
    };
    setFaqs((prev) => [...prev, faq]);
    setNewFaq({ question: "", answer: "", department: DEPARTMENTS[0] });
    setShowFaqForm(false);
  };

  const removeDoc = (id: string) => setDocuments((prev) => prev.filter((d) => d.id !== id));
  const removeFaq = (id: string) => setFaqs((prev) => prev.filter((f) => f.id !== id));

  const filteredDocs = filterDept === "all" ? documents : documents.filter((d) => d.department === filterDept);
  const filteredFaqs = filterDept === "all" ? faqs : faqs.filter((f) => f.department === filterDept);

  return (
    <Box p={8} maxW="100%">
      <HStack justify="space-between" mb={6}>
        <Box>
          <Heading size="md" color="gray.800">Knowledge Base</Heading>
          <Text fontSize="sm" color="gray.500" mt={1}>
            Upload documents and manage FAQs per department
          </Text>
        </Box>
        <Select size="sm" w="200px" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
          <option value="all">All Departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </Select>
      </HStack>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept=".pdf,.txt"
        multiple
        onChange={handleFileSelect}
      />

      {/* Document Upload Zone */}
      <Box
        border="2px dashed"
        borderColor={dragOver ? "blue.400" : "gray.200"}
        borderRadius="lg"
        p={8}
        mb={6}
        textAlign="center"
        bg={dragOver ? "blue.50" : "white"}
        transition="all 0.15s"
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        cursor="pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <Icon as={FiUpload} boxSize={8} color="gray.400" mb={3} />
        <Text fontSize="sm" color="gray.600" fontWeight="500">
          Drag & drop PDF or TXT files here
        </Text>
        <Text fontSize="xs" color="gray.400" mt={1}>
          or click to browse — files are uploaded per department
        </Text>
      </Box>

      {/* Documents Table */}
      <Box mb={8}>
        <Text fontWeight="600" fontSize="sm" color="gray.700" mb={3}>
          Documents ({filteredDocs.length})
        </Text>
        <VStack spacing={0} align="stretch" bg="white" borderRadius="lg" border="1px solid" borderColor="gray.200" overflow="hidden">
          {filteredDocs.length === 0 && (
            <Text fontSize="sm" color="gray.400" p={4} textAlign="center">No documents uploaded</Text>
          )}
          {filteredDocs.map((doc) => {
            const cfg = STATUS_CONFIG[doc.status];
            return (
              <Flex
                key={doc.id}
                px={4}
                py={3}
                align="center"
                justify="space-between"
                borderBottom="1px solid"
                borderColor="gray.100"
                _last={{ borderBottom: "none" }}
              >
                <HStack spacing={3} flex={1}>
                  <Icon as={FiFile} color="gray.400" />
                  <Box>
                    <Text fontSize="sm" fontWeight="500" color="gray.700">{doc.name}</Text>
                    <Text fontSize="xs" color="gray.400">{doc.department} &middot; {doc.size} &middot; {doc.uploadedAt}</Text>
                  </Box>
                </HStack>
                <HStack spacing={3}>
                  <Badge colorScheme={cfg.color} fontSize="10px" display="flex" alignItems="center" gap={1}>
                    <Icon as={cfg.icon} boxSize={3} />
                    {cfg.label}
                  </Badge>
                  <IconButton
                    aria-label="Remove"
                    icon={<Icon as={FiTrash2} />}
                    size="xs"
                    variant="ghost"
                    color="gray.400"
                    _hover={{ color: "red.500" }}
                    onClick={() => removeDoc(doc.id)}
                  />
                </HStack>
              </Flex>
            );
          })}
        </VStack>
      </Box>

      <Divider mb={8} />

      {/* Manual FAQ Section */}
      <Box>
        <HStack justify="space-between" mb={3}>
          <Box>
            <Text fontWeight="600" fontSize="sm" color="gray.700">
              Manual FAQs ({filteredFaqs.length})
            </Text>
            <Text fontSize="xs" color="gray.400">
              Q&A pairs stored as source_type: manual
            </Text>
          </Box>
          <Button
            size="sm"
            leftIcon={<Icon as={FiPlus} />}
            variant="outline"
            onClick={() => setShowFaqForm(!showFaqForm)}
          >
            Add FAQ
          </Button>
        </HStack>

        {/* Add FAQ Form */}
        {showFaqForm && (
          <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="lg" p={4} mb={4}>
            <VStack spacing={3} align="stretch">
              <Select
                size="sm"
                value={newFaq.department}
                onChange={(e) => setNewFaq({ ...newFaq, department: e.target.value })}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </Select>
              <Input
                size="sm"
                placeholder="Question"
                value={newFaq.question}
                onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
              />
              <Textarea
                size="sm"
                placeholder="Answer"
                rows={3}
                value={newFaq.answer}
                onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
              />
              <HStack justify="flex-end">
                <Button size="sm" variant="ghost" onClick={() => setShowFaqForm(false)}>Cancel</Button>
                <Button size="sm" colorScheme="blue" onClick={handleAddFaq}>Save</Button>
              </HStack>
            </VStack>
          </Box>
        )}

        {/* FAQ List */}
        <VStack spacing={0} align="stretch" bg="white" borderRadius="lg" border="1px solid" borderColor="gray.200" overflow="hidden">
          {filteredFaqs.length === 0 && (
            <Text fontSize="sm" color="gray.400" p={4} textAlign="center">No FAQs added</Text>
          )}
          {filteredFaqs.map((faq) => (
            <Box
              key={faq.id}
              px={4}
              py={3}
              borderBottom="1px solid"
              borderColor="gray.100"
              _last={{ borderBottom: "none" }}
            >
              <Flex justify="space-between" align="start">
                <Box flex={1} mr={4}>
                  <HStack spacing={2} mb={1}>
                    <Icon as={FiBook} boxSize={3} color="gray.400" />
                    <Text fontSize="sm" fontWeight="500" color="gray.700">{faq.question}</Text>
                  </HStack>
                  <Text fontSize="xs" color="gray.500" pl={5}>{faq.answer}</Text>
                  <Badge fontSize="10px" mt={2} ml={5} colorScheme="gray">{faq.department}</Badge>
                </Box>
                <IconButton
                  aria-label="Remove"
                  icon={<Icon as={FiTrash2} />}
                  size="xs"
                  variant="ghost"
                  color="gray.400"
                  _hover={{ color: "red.500" }}
                  onClick={() => removeFaq(faq.id)}
                />
              </Flex>
            </Box>
          ))}
        </VStack>
      </Box>
    </Box>
  );
}
