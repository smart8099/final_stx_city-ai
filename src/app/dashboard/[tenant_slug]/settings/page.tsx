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
  Flex,
  Divider,
  Badge,
  Switch,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import {
  FiSettings,
  FiCopy,
  FiEye,
  FiEyeOff,
  FiRefreshCw,
} from "react-icons/fi";

export default function SettingsPage() {
  const [showKey, setShowKey] = useState(false);
  const [apiKey] = useState("");
  const [branding, setBranding] = useState({
    cityName: "",
    primaryColor: "#1a56db",
    welcomeMessage: "",
    logoUrl: "",
  });
  const [widgetConfig, setWidgetConfig] = useState({
    position: "bottom-right",
    autoOpen: false,
    showDepartmentBadge: true,
    showConfidence: false,
    maxHeight: "520",
  });
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const embedSnippet = `<script src="https://cdn.cityassist.ai/widget.js" data-api-key="${apiKey}" data-color="${branding.primaryColor}"></script>`;

  return (
    <Box p={8} maxW="100%">
      <Box mb={6}>
        <Heading size="md" color="gray.800">Settings</Heading>
        <Text fontSize="sm" color="gray.500" mt={1}>
          Branding, widget configuration, and API key management
        </Text>
      </Box>

      <VStack spacing={6} align="stretch">
        {/* API Key */}
        <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="lg" p={5}>
          <Text fontWeight="600" fontSize="sm" color="gray.700" mb={4}>API Key</Text>
          <HStack>
            <Input
              size="sm"
              value={showKey ? apiKey : "ca_live_" + "•".repeat(20)}
              readOnly
              fontFamily="mono"
              fontSize="xs"
              bg="gray.50"
            />
            <IconBtn icon={showKey ? FiEyeOff : FiEye} label="Toggle" onClick={() => setShowKey(!showKey)} />
            <IconBtn icon={FiCopy} label="Copy" onClick={handleCopy} />
          </HStack>
          {copied && (
            <Text fontSize="xs" color="green.500" mt={1}>Copied to clipboard</Text>
          )}
          <Text fontSize="xs" color="gray.400" mt={2}>
            Use this key to authenticate widget and API requests.
          </Text>
        </Box>

        {/* Branding */}
        <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="lg" p={5}>
          <Text fontWeight="600" fontSize="sm" color="gray.700" mb={4}>Branding</Text>
          <VStack spacing={3} align="stretch">
            <Field
              label="City Name"
              value={branding.cityName}
              onChange={(v) => setBranding({ ...branding, cityName: v })}
            />
            <Field
              label="Primary Color"
              value={branding.primaryColor}
              onChange={(v) => setBranding({ ...branding, primaryColor: v })}
              type="color"
            />
            <Field
              label="Welcome Message"
              value={branding.welcomeMessage}
              onChange={(v) => setBranding({ ...branding, welcomeMessage: v })}
            />
            <Field
              label="Logo URL"
              value={branding.logoUrl}
              onChange={(v) => setBranding({ ...branding, logoUrl: v })}
              placeholder="https://..."
            />
          </VStack>
        </Box>

        {/* Widget Config */}
        <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="lg" p={5}>
          <Text fontWeight="600" fontSize="sm" color="gray.700" mb={4}>Widget Configuration</Text>
          <VStack spacing={4} align="stretch">
            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <FormLabel fontSize="sm" color="gray.600" mb={0}>Auto-open widget</FormLabel>
              <Switch
                size="sm"
                isChecked={widgetConfig.autoOpen}
                onChange={() => setWidgetConfig({ ...widgetConfig, autoOpen: !widgetConfig.autoOpen })}
              />
            </FormControl>
            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <FormLabel fontSize="sm" color="gray.600" mb={0}>Show department badge</FormLabel>
              <Switch
                size="sm"
                isChecked={widgetConfig.showDepartmentBadge}
                onChange={() => setWidgetConfig({ ...widgetConfig, showDepartmentBadge: !widgetConfig.showDepartmentBadge })}
              />
            </FormControl>
            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <FormLabel fontSize="sm" color="gray.600" mb={0}>Show confidence score</FormLabel>
              <Switch
                size="sm"
                isChecked={widgetConfig.showConfidence}
                onChange={() => setWidgetConfig({ ...widgetConfig, showConfidence: !widgetConfig.showConfidence })}
              />
            </FormControl>
          </VStack>
        </Box>

        {/* Embed Code */}
        <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="lg" p={5}>
          <Text fontWeight="600" fontSize="sm" color="gray.700" mb={2}>Embed Code</Text>
          <Text fontSize="xs" color="gray.400" mb={3}>
            Add this snippet to your website to deploy the CityAssist widget.
          </Text>
          <Box
            bg="gray.900"
            borderRadius="md"
            p={4}
            fontFamily="mono"
            fontSize="xs"
            color="green.300"
            overflowX="auto"
            whiteSpace="pre"
          >
            {embedSnippet}
          </Box>
          <Button
            size="xs"
            variant="ghost"
            mt={2}
            leftIcon={<Icon as={FiCopy} />}
            onClick={() => navigator.clipboard.writeText(embedSnippet)}
          >
            Copy snippet
          </Button>
        </Box>
      </VStack>
    </Box>
  );
}

function IconBtn({ icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <Button size="sm" variant="ghost" onClick={onClick} aria-label={label}>
      <Icon as={icon} />
    </Button>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <HStack>
      <Text fontSize="sm" color="gray.600" w="140px" flexShrink={0}>{label}</Text>
      {type === "color" ? (
        <HStack flex={1}>
          <Input
            size="sm"
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            w="40px"
            h="32px"
            p={0}
            border="none"
            cursor="pointer"
          />
          <Input
            size="sm"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            fontFamily="mono"
            fontSize="xs"
          />
        </HStack>
      ) : (
        <Input
          size="sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </HStack>
  );
}
