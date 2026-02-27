"use client";

import { useState } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Icon,
  Button,
  Input,
  Badge,
  Flex,
  IconButton,
  Divider,
} from "@chakra-ui/react";
import {
  FiUsers,
  FiPlus,
  FiTrash2,
  FiPhone,
  FiMail,
  FiTag,
  FiEdit2,
  FiX,
  FiCheck,
} from "react-icons/fi";
interface DepartmentConfig {
  id: string;
  name: string;
  contactEmail: string;
  contactPhone: string;
  keywords: string[];
  escalationEnabled: boolean;
}

const SEED_DEPARTMENTS: DepartmentConfig[] = [];

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentConfig[]>(SEED_DEPARTMENTS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newKeyword, setNewKeyword] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDept, setNewDept] = useState({ name: "", contactEmail: "", contactPhone: "" });

  const addDepartment = () => {
    if (!newDept.name.trim()) return;
    const dept: DepartmentConfig = {
      id: `dept-${Date.now()}`,
      name: newDept.name.trim(),
      contactEmail: newDept.contactEmail.trim(),
      contactPhone: newDept.contactPhone.trim(),
      keywords: [],
      escalationEnabled: false,
    };
    setDepartments((prev) => [...prev, dept]);
    setNewDept({ name: "", contactEmail: "", contactPhone: "" });
    setShowAddForm(false);
    setEditingId(dept.id);
  };

  const removeDepartment = (id: string) => {
    setDepartments((prev) => prev.filter((d) => d.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const addKeyword = (deptId: string) => {
    if (!newKeyword.trim()) return;
    setDepartments((prev) =>
      prev.map((d) =>
        d.id === deptId ? { ...d, keywords: [...d.keywords, newKeyword.trim().toLowerCase()] } : d
      )
    );
    setNewKeyword("");
  };

  const removeKeyword = (deptId: string, keyword: string) => {
    setDepartments((prev) =>
      prev.map((d) =>
        d.id === deptId ? { ...d, keywords: d.keywords.filter((k) => k !== keyword) } : d
      )
    );
  };

  const updateField = (deptId: string, field: keyof DepartmentConfig, value: string | boolean) => {
    setDepartments((prev) =>
      prev.map((d) => (d.id === deptId ? { ...d, [field]: value } : d))
    );
  };

  return (
    <Box p={8} maxW="100%">
      <HStack justify="space-between" mb={6}>
        <Box>
          <Heading size="md" color="gray.800">Departments</Heading>
          <Text fontSize="sm" color="gray.500" mt={1}>
            Configure routing keywords and contact info — no code required
          </Text>
        </Box>
        <Button
          size="sm"
          leftIcon={<Icon as={FiPlus} />}
          colorScheme="blue"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          Add Department
        </Button>
      </HStack>

      {/* Add Department Form */}
      {showAddForm && (
        <Box bg="white" border="1px solid" borderColor="blue.200" borderRadius="lg" p={5} mb={4}>
          <Text fontWeight="600" fontSize="sm" color="gray.700" mb={3}>New Department</Text>
          <VStack spacing={3} align="stretch">
            <Input
              size="sm"
              placeholder="Department name"
              value={newDept.name}
              onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && addDepartment()}
            />
            <HStack>
              <Input
                size="sm"
                placeholder="Contact email"
                value={newDept.contactEmail}
                onChange={(e) => setNewDept({ ...newDept, contactEmail: e.target.value })}
              />
              <Input
                size="sm"
                placeholder="Contact phone"
                value={newDept.contactPhone}
                onChange={(e) => setNewDept({ ...newDept, contactPhone: e.target.value })}
              />
            </HStack>
            <HStack justify="flex-end">
              <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
              <Button size="sm" colorScheme="blue" onClick={addDepartment}>Create</Button>
            </HStack>
          </VStack>
        </Box>
      )}

      <VStack spacing={4} align="stretch">
        {departments.length === 0 && !showAddForm && (
          <Flex
            direction="column"
            align="center"
            py={16}
            color="gray.400"
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="lg"
          >
            <Icon as={FiUsers} boxSize={10} mb={3} />
            <Text fontSize="sm" fontWeight="500" color="gray.500">No departments yet</Text>
            <Text fontSize="xs" color="gray.400" mt={1}>Click "Add Department" to get started</Text>
          </Flex>
        )}
        {departments.map((dept) => {
          const isEditing = editingId === dept.id;
          return (
            <Box
              key={dept.id}
              bg="white"
              border="1px solid"
              borderColor={isEditing ? "blue.200" : "gray.200"}
              borderRadius="lg"
              overflow="hidden"
              transition="all 0.15s"
            >
              {/* Department Header */}
              <Flex px={5} py={4} align="center" justify="space-between">
                <HStack spacing={3}>
                  <Flex
                    w={8}
                    h={8}
                    bg="blue.50"
                    borderRadius="md"
                    align="center"
                    justify="center"
                  >
                    <Icon as={FiUsers} color="blue.500" boxSize={4} />
                  </Flex>
                  <Box>
                    <Text fontWeight="600" fontSize="sm" color="gray.800">{dept.name}</Text>
                    <HStack spacing={3} fontSize="xs" color="gray.400">
                      <HStack spacing={1}>
                        <Icon as={FiMail} boxSize={3} />
                        <Text>{dept.contactEmail}</Text>
                      </HStack>
                      <HStack spacing={1}>
                        <Icon as={FiPhone} boxSize={3} />
                        <Text>{dept.contactPhone}</Text>
                      </HStack>
                    </HStack>
                  </Box>
                </HStack>
                <HStack spacing={2}>
                  <Badge
                    colorScheme={dept.escalationEnabled ? "green" : "gray"}
                    fontSize="10px"
                  >
                    {dept.escalationEnabled ? "Escalation On" : "Escalation Off"}
                  </Badge>
                  <IconButton
                    aria-label="Edit"
                    icon={<Icon as={isEditing ? FiCheck : FiEdit2} />}
                    size="xs"
                    variant="ghost"
                    onClick={() => setEditingId(isEditing ? null : dept.id)}
                  />
                  <IconButton
                    aria-label="Delete"
                    icon={<Icon as={FiTrash2} />}
                    size="xs"
                    variant="ghost"
                    color="gray.400"
                    _hover={{ color: "red.500" }}
                    onClick={() => removeDepartment(dept.id)}
                  />
                </HStack>
              </Flex>

              {/* Keywords */}
              <Box px={5} pb={4}>
                <HStack spacing={1} mb={2}>
                  <Icon as={FiTag} boxSize={3} color="gray.400" />
                  <Text fontSize="xs" fontWeight="500" color="gray.500">
                    Routing Keywords
                  </Text>
                </HStack>
                <Flex gap={2} flexWrap="wrap">
                  {dept.keywords.map((kw) => (
                    <Badge
                      key={kw}
                      px={2}
                      py={0.5}
                      borderRadius="full"
                      fontSize="11px"
                      colorScheme="gray"
                      variant="subtle"
                      display="flex"
                      alignItems="center"
                      gap={1}
                    >
                      {kw}
                      {isEditing && (
                        <Icon
                          as={FiX}
                          boxSize={3}
                          cursor="pointer"
                          _hover={{ color: "red.500" }}
                          onClick={() => removeKeyword(dept.id, kw)}
                        />
                      )}
                    </Badge>
                  ))}
                </Flex>
              </Box>

              {/* Editing Panel */}
              {isEditing && (
                <Box px={5} pb={4} pt={2} borderTop="1px solid" borderColor="gray.100">
                  <VStack spacing={3} align="stretch">
                    <HStack>
                      <Input
                        size="sm"
                        placeholder="Add keyword..."
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addKeyword(dept.id)}
                      />
                      <Button size="sm" onClick={() => addKeyword(dept.id)} leftIcon={<Icon as={FiPlus} />}>
                        Add
                      </Button>
                    </HStack>
                    <HStack>
                      <Input
                        size="sm"
                        placeholder="Email"
                        value={dept.contactEmail}
                        onChange={(e) => updateField(dept.id, "contactEmail", e.target.value)}
                      />
                      <Input
                        size="sm"
                        placeholder="Phone"
                        value={dept.contactPhone}
                        onChange={(e) => updateField(dept.id, "contactPhone", e.target.value)}
                      />
                    </HStack>
                    <Button
                      size="xs"
                      variant="ghost"
                      colorScheme={dept.escalationEnabled ? "red" : "green"}
                      onClick={() => updateField(dept.id, "escalationEnabled", !dept.escalationEnabled)}
                    >
                      {dept.escalationEnabled ? "Disable Escalation" : "Enable Escalation"}
                    </Button>
                  </VStack>
                </Box>
              )}
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
}
