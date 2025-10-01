import React, { useState } from "react";
import {
  Send,
  Mail,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Shield,
  Zap,
  Clock,
  Star,
  RefreshCw,
  Download,
  Settings,
} from "lucide-react";

interface TestResult {
  score: number;
  issues: Array<{
    type: "error" | "warning" | "info";
    message: string;
    suggestion?: string;
  }>;
  details: {
    spamScore: number;
    deliverability: number;
    compatibility: Record<string, boolean>;
    performance: {
      loadTime: number;
      size: number;
    };
  };
}

interface TemplateTestingProps {
  templateContent: string;
  templateSubject: string;
  variables?: Record<string, string>;
  onSendTest?: (emails: string[], content: string) => Promise<void>;
}

export const TemplateTesting: React.FC<TemplateTestingProps> = ({
  templateContent,
  templateSubject,
  variables = {},
  onSendTest,
}) => {
  const [activeTab, setActiveTab] = useState<
    "test" | "preview" | "spam" | "compatibility"
  >("test");
  const [testEmails, setTestEmails] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [previewClient, setPreviewClient] = useState<
    "gmail" | "outlook" | "apple" | "yahoo"
  >("gmail");
  const [previewDevice, setPreviewDevice] = useState<
    "desktop" | "mobile" | "tablet"
  >("desktop");

  const emailClients = [
    { id: "gmail", name: "Gmail", supported: true },
    { id: "outlook", name: "Outlook", supported: true },
    { id: "apple", name: "Apple Mail", supported: true },
    { id: "yahoo", name: "Yahoo Mail", supported: false },
    { id: "thunderbird", name: "Thunderbird", supported: true },
    { id: "aol", name: "AOL Mail", supported: false },
  ];

  const processTemplate = (content: string) => {
    let processed = content;
    Object.entries(variables).forEach(([key, value]) => {
      processed = processed.replace(new RegExp(`{{${key}}}`, "g"), value);
    });
    return processed;
  };

  const sendTestEmail = async () => {
    if (!testEmails.trim() || !onSendTest) return;

    setSending(true);
    try {
      const emails = testEmails
        .split(",")
        .map((email) => email.trim())
        .filter(Boolean);
      const processedContent = processTemplate(templateContent);
      await onSendTest(emails, processedContent);
      // Show success message
    } catch (error) {
      console.error("Failed to send test email:", error);
    } finally {
      setSending(false);
    }
  };

  const runSpamAnalysis = async () => {
    setAnalyzing(true);

    // Simulate spam analysis
    setTimeout(() => {
      const mockResult: TestResult = {
        score: Math.floor(Math.random() * 40) + 60, // 60-100
        issues: [
          {
            type: "warning",
            message: "Subject line contains promotional language",
            suggestion:
              "Consider using more neutral language to improve deliverability",
          },
          {
            type: "info",
            message: "HTML to text ratio is good",
          },
          {
            type: "error",
            message: "Missing unsubscribe link",
            suggestion: "Add an unsubscribe link to comply with regulations",
          },
        ],
        details: {
          spamScore: Math.floor(Math.random() * 3) + 1, // 1-3
          deliverability: Math.floor(Math.random() * 20) + 80, // 80-100
          compatibility: {
            gmail: true,
            outlook: true,
            apple: true,
            yahoo: false,
            thunderbird: true,
            aol: false,
          },
          performance: {
            loadTime: Math.floor(Math.random() * 1000) + 500, // 500-1500ms
            size: Math.floor(Math.random() * 50) + 20, // 20-70kb
          },
        },
      };

      setTestResult(mockResult);
      setAnalyzing(false);
    }, 2000);
  };

  const TestEmailSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Send Test Email
        </h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">
                Test your email before sending
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                Send a test version to yourself or team members to check
                formatting, links, and content.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Email Addresses
            </label>
            <textarea
              value={testEmails}
              onChange={(e) => setTestEmails(e.target.value)}
              placeholder="Enter email addresses separated by commas&#10;example@domain.com, test@company.com"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
            <p className="text-sm text-gray-500 mt-1">
              Separate multiple email addresses with commas
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject Line Preview
            </label>
            <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
              {processTemplate(templateSubject) || "No subject line"}
            </div>
          </div>

          <button
            onClick={sendTestEmail}
            disabled={!testEmails.trim() || sending}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {sending ? "Sending..." : "Send Test Email"}
          </button>
        </div>
      </div>
    </div>
  );

  const SpamAnalysisSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Spam Score Analysis
        </h3>
        <button
          onClick={runSpamAnalysis}
          disabled={analyzing}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {analyzing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Shield className="w-4 h-4" />
          )}
          {analyzing ? "Analyzing..." : "Run Analysis"}
        </button>
      </div>

      {testResult && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">
                Overall Score
              </h4>
              <div
                className={`text-2xl font-bold ${
                  testResult.score >= 80
                    ? "text-green-600"
                    : testResult.score >= 60
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {testResult.score}/100
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${
                  testResult.score >= 80
                    ? "bg-green-500"
                    : testResult.score >= 60
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${testResult.score}%` }}
              />
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <h5 className="font-medium text-gray-900">Spam Score</h5>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {testResult.details.spamScore}/10
              </div>
              <p className="text-sm text-gray-600">Lower is better</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-green-600" />
                <h5 className="font-medium text-gray-900">Deliverability</h5>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {testResult.details.deliverability}%
              </div>
              <p className="text-sm text-gray-600">Inbox placement rate</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <h5 className="font-medium text-gray-900">Load Time</h5>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {testResult.details.performance.loadTime}ms
              </div>
              <p className="text-sm text-gray-600">Email render time</p>
            </div>
          </div>

          {/* Issues and Suggestions */}
          {testResult.issues.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Issues & Suggestions
              </h4>
              <div className="space-y-4">
                {testResult.issues.map((issue, index) => (
                  <div key={index} className="flex items-start gap-3">
                    {issue.type === "error" && (
                      <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    )}
                    {issue.type === "warning" && (
                      <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                    )}
                    {issue.type === "info" && (
                      <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-gray-900">{issue.message}</p>
                      {issue.suggestion && (
                        <p className="text-sm text-gray-600 mt-1">
                          {issue.suggestion}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const CompatibilitySection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        Email Client Compatibility
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {emailClients.map((client) => (
          <div
            key={client.id}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-400" />
                <span className="font-medium text-gray-900">{client.name}</span>
              </div>
              {client.supported ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {client.supported ? "Fully supported" : "Limited support"}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-900">Compatibility Notes</h4>
            <ul className="text-sm text-yellow-800 mt-2 space-y-1">
              <li>
                • Some advanced CSS features may not work in older email clients
              </li>
              <li>
                • Always test in multiple clients before sending to large
                audiences
              </li>
              <li>
                • Consider providing a web version link for best compatibility
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const PreviewSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Client Preview</h3>
        <div className="flex items-center gap-4">
          <select
            value={previewClient}
            onChange={(e) => setPreviewClient(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="gmail">Gmail</option>
            <option value="outlook">Outlook</option>
            <option value="apple">Apple Mail</option>
            <option value="yahoo">Yahoo Mail</option>
          </select>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreviewDevice("desktop")}
              className={`p-2 rounded ${
                previewDevice === "desktop"
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewDevice("tablet")}
              className={`p-2 rounded ${
                previewDevice === "tablet"
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewDevice("mobile")}
              className={`p-2 rounded ${
                previewDevice === "mobile"
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 text-sm text-gray-600">
          {previewClient.charAt(0).toUpperCase() + previewClient.slice(1)} -{" "}
          {previewDevice.charAt(0).toUpperCase() + previewDevice.slice(1)} View
        </div>
        <div
          className={`mx-auto ${
            previewDevice === "desktop"
              ? "max-w-2xl"
              : previewDevice === "tablet"
              ? "max-w-md"
              : "max-w-sm"
          }`}
        >
          <div
            className="p-4 min-h-[400px]"
            dangerouslySetInnerHTML={{
              __html: processTemplate(templateContent),
            }}
            style={{
              lineHeight: "1.6",
              fontSize: previewDevice === "mobile" ? "14px" : "16px",
            }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Template Testing</h2>
          <p className="text-gray-600 mt-1">
            Test your email template before sending to ensure optimal delivery
            and appearance
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "test", label: "Send Test", icon: Send },
              { id: "preview", label: "Preview", icon: Eye },
              { id: "spam", label: "Spam Analysis", icon: Shield },
              { id: "compatibility", label: "Compatibility", icon: Globe },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4 inline mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {activeTab === "test" && <TestEmailSection />}
          {activeTab === "preview" && <PreviewSection />}
          {activeTab === "spam" && <SpamAnalysisSection />}
          {activeTab === "compatibility" && <CompatibilitySection />}
        </div>
      </div>
    </div>
  );
};
