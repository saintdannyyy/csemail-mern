import React, { useState, useEffect } from "react";
import {
  Save,
  Mail,
  Server,
  Shield,
  Settings as SettingsIcon,
  TestTube,
  Download,
  // Upload,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface SMTPConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  secure: boolean;
  fromName: string;
  fromEmail: string;
}

interface SystemSettings {
  email: Array<{ key: string; value: string; description: string }>;
  queue: Array<{ key: string; value: string; description: string }>;
  security: Array<{ key: string; value: string; description: string }>;
  general: Array<{ key: string; value: string; description: string }>;
}

export const Settings: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("smtp");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpConfig, setSmtpConfig] = useState<SMTPConfig>({
    host: "",
    port: 587,
    username: "",
    password: "",
    secure: true,
    fromName: "Emmisor Team",
    fromEmail: "noreply@emmisor.com",
  });
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    email: [],
    queue: [],
    security: [],
    general: [],
  });
  const [testEmail, setTestEmail] = useState("");
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: "success" | "error" | "info";
      message: string;
    }>
  >([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch SMTP config from backend
      const smtpResponse = await (
        await import("../utils/apiClient")
      ).apiClient.get<any>("/api/settings/smtp");
      setSmtpConfig({
        host: smtpResponse?.smtp_host || "",
        port: smtpResponse?.smtp_port ? Number(smtpResponse.smtp_port) : 587,
        username: smtpResponse?.smtp_username || "",
        password: smtpResponse?.smtp_password || "",
        secure:
          smtpResponse?.smtp_secure === "true" ||
          smtpResponse?.smtp_secure === true,
        fromName: smtpResponse?.smtp_from_name || "",
        fromEmail: smtpResponse?.smtp_from_email || "",
      });

      // Fetch system settings from backend
      const settingsResponse = await (
        await import("../utils/apiClient")
      ).apiClient.get<any>("/api/settings");
      setSystemSettings(
        settingsResponse &&
          typeof settingsResponse === "object" &&
          settingsResponse.email &&
          settingsResponse.queue &&
          settingsResponse.security &&
          settingsResponse.general
          ? settingsResponse
          : { email: [], queue: [], security: [], general: [] }
      );
    } catch (error: any) {
      setError(error?.message || "Failed to load settings");
      console.error("Failed to fetch settings:", error);
      addNotification("error", "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const addNotification = (
    type: "success" | "error" | "info",
    message: string
  ) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  const saveSmtpConfig = async () => {
    setSaving(true);
    try {
      await (
        await import("../utils/apiClient")
      ).apiClient.put("/api/settings/smtp", {
        host: smtpConfig.host,
        port: smtpConfig.port,
        username: smtpConfig.username,
        password: smtpConfig.password,
        secure: smtpConfig.secure,
        fromName: smtpConfig.fromName,
        fromEmail: smtpConfig.fromEmail,
      });
      addNotification("success", "SMTP configuration saved successfully");
    } catch (error) {
      console.error("Failed to save SMTP config:", error);
      addNotification("error", "Failed to save SMTP configuration");
    } finally {
      setSaving(false);
    }
  };

  const testSmtpConnection = async () => {
    if (!testEmail) {
      addNotification("error", "Please enter a test email address");
      return;
    }

    setTestingSmtp(true);
    try {
      const response = (await (
        await import("../utils/apiClient")
      ).apiClient.post("/api/settings/smtp/test", {
        testEmail: testEmail,
      })) as { success: boolean; message?: string };

      if (response.success) {
        addNotification(
          "success",
          `Test email sent successfully to ${testEmail}`
        );
      } else {
        addNotification(
          "error",
          response.message || "SMTP connection test failed"
        );
      }
    } catch (error) {
      console.error("SMTP test failed:", error);
      addNotification("error", "SMTP connection test failed");
    } finally {
      setTestingSmtp(false);
    }
  };

  const saveSystemSettings = async (category: keyof SystemSettings) => {
    setSaving(true);
    try {
      await (
        await import("../utils/apiClient")
      ).apiClient.put("/api/settings", {
        settings: systemSettings[category],
      });
      addNotification(
        "success",
        `${
          category.charAt(0).toUpperCase() + category.slice(1)
        } settings saved successfully`
      );
    } catch (error) {
      console.error(`Failed to save ${category} settings:`, error);
      addNotification("error", `Failed to save ${category} settings`);
    } finally {
      setSaving(false);
    }
  };

  const exportSettings = async () => {
    try {
      const settings = {
        smtp: smtpConfig,
        system: systemSettings,
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(settings, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `emmisor-settings-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addNotification("success", "Settings exported successfully");
    } catch (error) {
      addNotification("error", "Failed to export settings");
    }
  };

  const updateSystemSetting = (
    category: keyof SystemSettings,
    key: string,
    value: string
  ) => {
    setSystemSettings((prev) => ({
      ...prev,
      [category]: prev[category].map((setting) =>
        setting.key === key ? { ...setting, value } : setting
      ),
    }));
  };

  const tabs = [
    { id: "smtp", name: "SMTP Configuration", icon: Mail },
    { id: "email", name: "Email Settings", icon: SettingsIcon },
    { id: "queue", name: "Queue Settings", icon: Server },
    { id: "security", name: "Security", icon: Shield },
    { id: "general", name: "General", icon: SettingsIcon },
  ];

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>
        <button
          onClick={() => {
            setError(null);
            fetchSettings();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Fallback for empty settings */}
      {!smtpConfig.host && !smtpConfig.username && !smtpConfig.fromEmail && (
        <div className="bg-yellow-100 text-yellow-700 p-4 rounded mb-4">
          No SMTP configuration found.
        </div>
      )}
      {Object.values(systemSettings).every(
        (arr) => Array.isArray(arr) && arr.length === 0
      ) && (
        <div className="bg-yellow-100 text-yellow-700 p-4 rounded mb-4">
          No system settings found.
        </div>
      )}
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-md shadow-lg ${
              notification.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : notification.type === "error"
                ? "bg-red-50 text-red-800 border border-red-200"
                : "bg-blue-50 text-blue-800 border border-blue-200"
            }`}
          >
            <div className="flex items-center">
              {notification.type === "success" && (
                <CheckCircle className="h-5 w-5 mr-2" />
              )}
              {notification.type === "error" && (
                <AlertTriangle className="h-5 w-5 mr-2" />
              )}
              <span className="text-sm font-medium">
                {notification.message}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              System Settings
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Configure system-wide settings and preferences
            </p>
          </div>
          <button
            onClick={exportSettings}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Settings
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "smtp" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  SMTP Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Host
                    </label>
                    <input
                      type="text"
                      value={smtpConfig.host}
                      onChange={(e) =>
                        setSmtpConfig((prev) => ({
                          ...prev,
                          host: e.target.value,
                        }))
                      }
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder={
                        import.meta.env.VITE_SMTP_HOST || "smtp.gmail.com"
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Port
                    </label>
                    <input
                      type="number"
                      value={smtpConfig.port}
                      onChange={(e) =>
                        setSmtpConfig((prev) => ({
                          ...prev,
                          port: parseInt(e.target.value),
                        }))
                      }
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={smtpConfig.username}
                      onChange={(e) =>
                        setSmtpConfig((prev) => ({
                          ...prev,
                          username: e.target.value,
                        }))
                      }
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={smtpConfig.password}
                      onChange={(e) =>
                        setSmtpConfig((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Name
                    </label>
                    <input
                      type="text"
                      value={smtpConfig.fromName}
                      onChange={(e) =>
                        setSmtpConfig((prev) => ({
                          ...prev,
                          fromName: e.target.value,
                        }))
                      }
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Email
                    </label>
                    <input
                      type="email"
                      value={smtpConfig.fromEmail}
                      onChange={(e) =>
                        setSmtpConfig((prev) => ({
                          ...prev,
                          fromEmail: e.target.value,
                        }))
                      }
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={smtpConfig.secure}
                      onChange={(e) =>
                        setSmtpConfig((prev) => ({
                          ...prev,
                          secure: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Use SSL/TLS
                    </span>
                  </label>
                </div>
              </div>

              {/* Test SMTP */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  Test SMTP Connection
                </h4>
                <div className="flex items-center space-x-4">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="block w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="test@example.com"
                  />
                  <button
                    onClick={testSmtpConnection}
                    disabled={testingSmtp}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    {testingSmtp ? "Testing..." : "Send Test Email"}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={saveSmtpConfig}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save SMTP Configuration"}
                </button>
              </div>
            </div>
          )}

          {["email", "queue", "security", "general"].includes(activeTab) && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {tabs.find((t) => t.id === activeTab)?.name}
                </h3>
                <div className="space-y-4">
                  {systemSettings[activeTab as keyof SystemSettings].map(
                    (setting) => (
                      <div
                        key={setting.key}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center"
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            {setting.key
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </label>
                          <p className="text-xs text-gray-500 mt-1">
                            {setting.description}
                          </p>
                        </div>
                        <div>
                          <input
                            type="text"
                            value={setting.value}
                            onChange={(e) =>
                              updateSystemSetting(
                                activeTab as keyof SystemSettings,
                                setting.key,
                                e.target.value
                              )
                            }
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() =>
                    saveSystemSettings(activeTab as keyof SystemSettings)
                  }
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
