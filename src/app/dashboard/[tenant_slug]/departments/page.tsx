"use client";

import { useState, useEffect } from "react";
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
} from "@chakra-ui/react";
import {
  FiUsers,
  FiUser,
  FiPlus,
  FiTrash2,
  FiPhone,
  FiMail,
  FiTag,
  FiEdit2,
  FiX,
  FiCheck,
} from "react-icons/fi";
import { useParams } from "next/navigation";
import { useDepartments } from "@/lib/department-store";
import { DepartmentConfig } from "@/lib/types";

export default function DepartmentsPage() {
  const params = useParams();
  const slug = params.tenant_slug as string;
  const { departments, addDepartment, removeDepartment, updateDepartment, setTenantSlug } =
    useDepartments();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [newKeyword, setNewKeyword] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDept, setNewDept] = useState({ name: "", contactEmail: "", contactPhone: "" });
  const [errors, setErrors] = useState<{ email?: string; phone?: string }>({});
  const [editErrors, setEditErrors] = useState<{ email?: string; phone?: string }>({});
  const [newMember, setNewMember] = useState({ firstName: "", lastName: "", email: "" });
  const [memberErrors, setMemberErrors] = useState<{ firstName?: string; lastName?: string; email?: string }>({});

  const validateEmail = (email: string) => {
    if (!email.trim()) return undefined;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email) ? undefined : "Invalid email format";
  };

  const validatePhone = (phone: string) => {
    if (!phone.trim()) return undefined;
    // Only allow digits, spaces, hyphens, parentheses, dots, and + prefix
    if (!/^[\d\s\-\(\)\+\.]+$/.test(phone.trim())) return "Only numbers, spaces, hyphens, and parentheses allowed";
    // + only allowed at the start
    if (phone.includes("+") && phone.trim().indexOf("+") !== 0) return "'+' only allowed at the start";
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 0) return "Enter a valid phone number";
    if (digits.length < 10) return `Too few digits (${digits.length}/10 minimum)`;
    if (digits.length > 15) return `Too many digits (${digits.length}/15 maximum)`;
    return undefined;
  };

  useEffect(() => {
    setTenantSlug(slug);
  }, [slug, setTenantSlug]);

  const handleAdd = () => {
    if (!newDept.name.trim()) return;
    const emailErr = validateEmail(newDept.contactEmail);
    const phoneErr = validatePhone(newDept.contactPhone);
    setErrors({ email: emailErr, phone: phoneErr });
    if (emailErr || phoneErr) return;

    const dept: DepartmentConfig = {
      id: `dept-${Date.now()}`,
      name: newDept.name.trim(),
      contactEmail: newDept.contactEmail.trim(),
      contactPhone: newDept.contactPhone.trim(),
      keywords: [],
      escalationEnabled: false,
      members: [],
    };
    addDepartment(dept);
    setNewDept({ name: "", contactEmail: "", contactPhone: "" });
    setErrors({});
    setShowAddForm(false);
    setEditingId(dept.id);
  };

  const handleRemove = (id: string) => {
    removeDepartment(id);
    if (editingId === id) setEditingId(null);
  };

  const handleAddKeyword = (deptId: string) => {
    if (!newKeyword.trim()) return;
    const dept = departments.find((d) => d.id === deptId);
    if (dept) {
      updateDepartment(deptId, { keywords: [...dept.keywords, newKeyword.trim().toLowerCase()] });
    }
    setNewKeyword("");
  };

  const handleRemoveKeyword = (deptId: string, keyword: string) => {
    const dept = departments.find((d) => d.id === deptId);
    if (dept) {
      updateDepartment(deptId, { keywords: dept.keywords.filter((k) => k !== keyword) });
    }
  };

  const handleAddMember = (deptId: string) => {
    const errs: { firstName?: string; lastName?: string; email?: string } = {};
    if (!newMember.firstName.trim()) errs.firstName = "First name is required";
    if (!newMember.lastName.trim()) errs.lastName = "Last name is required";
    if (!newMember.email.trim()) { errs.email = "Email is required"; }
    else { const emailErr = validateEmail(newMember.email); if (emailErr) errs.email = emailErr; }
    if (Object.keys(errs).length > 0) { setMemberErrors(errs); return; }
    const dept = departments.find((d) => d.id === deptId);
    if (dept) {
      const exists = (dept.members || []).some((m) => m.email.toLowerCase() === newMember.email.trim().toLowerCase());
      if (exists) { setMemberErrors({ email: "Member with this email already exists" }); return; }
      updateDepartment(deptId, {
        members: [...(dept.members || []), { id: `member-${Date.now()}`, firstName: newMember.firstName.trim(), lastName: newMember.lastName.trim(), email: newMember.email.trim() }],
      });
    }
    setNewMember({ firstName: "", lastName: "", email: "" });
    setMemberErrors({});
  };

  const handleRemoveMember = (deptId: string, memberId: string) => {
    const dept = departments.find((d) => d.id === deptId);
    if (dept) {
      updateDepartment(deptId, { members: (dept.members || []).filter((m) => m.id !== memberId) });
    }
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

      {showAddForm && (
        <Box bg="white" border="1px solid" borderColor="blue.200" borderRadius="lg" p={5} mb={4}>
          <Text fontWeight="600" fontSize="sm" color="gray.700" mb={3}>New Department</Text>
          <VStack spacing={3} align="stretch">
            <Input
              size="sm"
              placeholder="Department name"
              value={newDept.name}
              onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Box>
              <HStack>
                <Box flex={1}>
                  <Input
                    size="sm"
                    placeholder="Contact email"
                    type="email"
                    value={newDept.contactEmail}
                    isInvalid={!!errors.email}
                    onChange={(e) => { setNewDept({ ...newDept, contactEmail: e.target.value }); setErrors({ ...errors, email: validateEmail(e.target.value) }); }}
                  />
                  {errors.email && <Text fontSize="xs" color="red.500" mt={1}>{errors.email}</Text>}
                </Box>
                <Box flex={1}>
                  <Input
                    size="sm"
                    placeholder="Contact phone"
                    type="tel"
                    value={newDept.contactPhone}
                    isInvalid={!!errors.phone}
                    onChange={(e) => { setNewDept({ ...newDept, contactPhone: e.target.value }); setErrors({ ...errors, phone: validatePhone(e.target.value) }); }}
                  />
                  {errors.phone && <Text fontSize="xs" color="red.500" mt={1}>{errors.phone}</Text>}
                </Box>
              </HStack>
            </Box>
            <HStack justify="flex-end">
              <Button size="sm" variant="ghost" onClick={() => { setShowAddForm(false); setErrors({}); }}>Cancel</Button>
              <Button size="sm" colorScheme="blue" onClick={handleAdd}>Create</Button>
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
            <Text fontSize="xs" color="gray.400" mt={1}>Click &quot;Add Department&quot; to get started</Text>
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
              <Flex px={5} py={4} align="center" justify="space-between">
                <HStack spacing={3}>
                  <Flex w={8} h={8} bg="blue.50" borderRadius="md" align="center" justify="center">
                    <Icon as={FiUsers} color="blue.500" boxSize={4} />
                  </Flex>
                  <Box>
                    <Text fontWeight="600" fontSize="sm" color="gray.800">{dept.name}</Text>
                    <HStack spacing={3} fontSize="xs" color="gray.400">
                      <HStack spacing={1}>
                        <Icon as={FiMail} boxSize={3} />
                        <Text>{dept.contactEmail || "—"}</Text>
                      </HStack>
                      <HStack spacing={1}>
                        <Icon as={FiPhone} boxSize={3} />
                        <Text>{dept.contactPhone || "—"}</Text>
                      </HStack>
                    </HStack>
                  </Box>
                </HStack>
                <HStack spacing={2}>
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
                    onClick={() => handleRemove(dept.id)}
                  />
                </HStack>
              </Flex>

              <Box px={5} pb={4}>
                <HStack spacing={1} mb={2}>
                  <Icon as={FiTag} boxSize={3} color="gray.400" />
                  <Text fontSize="xs" fontWeight="500" color="gray.500">Routing Keywords</Text>
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
                          onClick={() => handleRemoveKeyword(dept.id, kw)}
                        />
                      )}
                    </Badge>
                  ))}
                </Flex>
              </Box>

              {isEditing && (
                <Box px={5} pb={4} pt={2} borderTop="1px solid" borderColor="gray.100">
                  <VStack spacing={3} align="stretch">
                    <HStack>
                      <Input
                        size="sm"
                        placeholder="Add keyword..."
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddKeyword(dept.id)}
                      />
                      <Button size="sm" onClick={() => handleAddKeyword(dept.id)} leftIcon={<Icon as={FiPlus} />}>
                        Add
                      </Button>
                    </HStack>
                    <HStack align="start">
                      <Box flex={1}>
                        <Input
                          size="sm"
                          placeholder="Email"
                          type="email"
                          value={dept.contactEmail}
                          isInvalid={!!editErrors.email}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDepartment(dept.id, { contactEmail: val });
                            const err = validateEmail(val);
                            setEditErrors((prev) => ({ ...prev, email: err }));
                          }}
                          onBlur={() => setEditErrors((prev) => ({ ...prev, email: validateEmail(dept.contactEmail) }))}
                        />
                        {editErrors.email && <Text fontSize="xs" color="red.500" mt={1}>{editErrors.email}</Text>}
                      </Box>
                      <Box flex={1}>
                        <Input
                          size="sm"
                          placeholder="Phone"
                          type="tel"
                          value={dept.contactPhone}
                          isInvalid={!!editErrors.phone}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDepartment(dept.id, { contactPhone: val });
                            const err = validatePhone(val);
                            setEditErrors((prev) => ({ ...prev, phone: err }));
                          }}
                          onBlur={() => setEditErrors((prev) => ({ ...prev, phone: validatePhone(dept.contactPhone) }))}
                        />
                        {editErrors.phone && <Text fontSize="xs" color="red.500" mt={1}>{editErrors.phone}</Text>}
                      </Box>
                    </HStack>

                    {/* Members */}
                    <Box pt={2} borderTop="1px solid" borderColor="gray.100">
                      <HStack spacing={1} mb={2}>
                        <Icon as={FiUser} boxSize={3} color="gray.400" />
                        <Text fontSize="xs" fontWeight="500" color="gray.500">Members</Text>
                        {(dept.members || []).length > 0 && (
                          <Badge fontSize="9px" colorScheme="gray" borderRadius="full" px={1.5}>
                            {(dept.members || []).length}
                          </Badge>
                        )}
                      </HStack>
                      <VStack spacing={1.5} align="stretch" mb={2}>
                        {(dept.members || []).map((member) => (
                          <HStack key={member.id} justify="space-between" bg="gray.50" px={3} py={1.5} borderRadius="md">
                            <HStack spacing={2}>
                              <Text fontSize="xs" fontWeight="500" color="gray.700">{member.firstName} {member.lastName}</Text>
                              <Text fontSize="xs" color="gray.400">{member.email}</Text>
                            </HStack>
                            <IconButton
                              aria-label="Remove member"
                              icon={<Icon as={FiX} boxSize={3} />}
                              size="xs"
                              variant="ghost"
                              color="gray.400"
                              _hover={{ color: "red.500" }}
                              onClick={() => handleRemoveMember(dept.id, member.id)}
                            />
                          </HStack>
                        ))}
                      </VStack>
                      <HStack align="start">
                        <Box flex={1}>
                          <Input
                            size="sm"
                            placeholder="First Name"
                            value={newMember.firstName}
                            isInvalid={!!memberErrors.firstName}
                            onChange={(e) => { setNewMember({ ...newMember, firstName: e.target.value }); setMemberErrors((prev) => ({ ...prev, firstName: undefined })); }}
                          />
                          {memberErrors.firstName && <Text fontSize="xs" color="red.500" mt={1}>{memberErrors.firstName}</Text>}
                        </Box>
                        <Box flex={1}>
                          <Input
                            size="sm"
                            placeholder="Last Name"
                            value={newMember.lastName}
                            isInvalid={!!memberErrors.lastName}
                            onChange={(e) => { setNewMember({ ...newMember, lastName: e.target.value }); setMemberErrors((prev) => ({ ...prev, lastName: undefined })); }}
                          />
                          {memberErrors.lastName && <Text fontSize="xs" color="red.500" mt={1}>{memberErrors.lastName}</Text>}
                        </Box>
                        <Box flex={1}>
                          <Input
                            size="sm"
                            placeholder="Email"
                            type="email"
                            value={newMember.email}
                            isInvalid={!!memberErrors.email}
                            onChange={(e) => { setNewMember({ ...newMember, email: e.target.value }); setMemberErrors((prev) => ({ ...prev, email: undefined })); }}
                            onKeyDown={(e) => e.key === "Enter" && handleAddMember(dept.id)}
                          />
                          {memberErrors.email && <Text fontSize="xs" color="red.500" mt={1}>{memberErrors.email}</Text>}
                        </Box>
                        <Button size="sm" onClick={() => handleAddMember(dept.id)} leftIcon={<Icon as={FiPlus} />} flexShrink={0}>
                          Add
                        </Button>
                      </HStack>
                    </Box>
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
