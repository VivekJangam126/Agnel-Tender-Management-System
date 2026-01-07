import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Lock, 
  FileText,
  Calendar,
  Building,
  Tag,
  DollarSign
} from "lucide-react";

export default function StepReviewPublish({ data, onUpdate, onValidationChange }) {
  const navigate = useNavigate();
  const [validationChecks, setValidationChecks] = useState({});
  const [isPublishing, setIsPublishing] = useState(false);

  // Validation logic
  useEffect(() => {
    const checks = {
      hasTitle: {
        passed: Boolean(data?.basicInfo?.title?.trim()),
        label: "Tender title is present",
      },
      hasDescription: {
        passed: Boolean(data?.basicInfo?.description?.trim()),
        label: "Short description provided",
      },
      hasCategory: {
        passed: Boolean(data?.basicInfo?.category),
        label: "Category selected",
      },
      validDeadline: {
        passed: Boolean(data?.basicInfo?.submissionDeadline) && 
                 new Date(data.basicInfo.submissionDeadline) > new Date(),
        label: "Valid submission deadline set",
      },
      hasSections: {
        passed: Array.isArray(data?.sections) && data.sections.length > 0,
        label: "At least one section created",
      },
      mandatoryCompleted: {
        passed: Array.isArray(data?.sections) && 
                data.sections
                  .filter(s => s.mandatory)
                  .every(s => s.content && s.content.trim().length > 0),
        label: "All mandatory sections have content",
      },
    };

    setValidationChecks(checks);

    // Check if all validations pass
    const allPassed = Object.values(checks).every(check => check.passed);
    if (onValidationChange) {
      onValidationChange(allPassed);
    }
  }, [data]);

  const handlePublish = async () => {
    const confirmed = window.confirm(
      "IMPORTANT: Once published, this tender cannot be edited or deleted.\n\n" +
      "Are you absolutely sure you want to publish this tender?"
    );

    if (!confirmed) return;

    setIsPublishing(true);

    // Simulate publish API call
    setTimeout(() => {
      // Mock publish action
      console.log("Publishing tender:", {
        ...data,
        status: "PUBLISHED",
        publishedAt: new Date().toISOString(),
        publishedBy: "Admin User",
      });

      alert("✅ Tender published successfully!");
      
      // Redirect to admin dashboard
      navigate("/admin/dashboard");
    }, 1500);
  };

  const allValid = Object.values(validationChecks).every(check => check.passed);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">
          Review & Publish
        </h2>
        <p className="text-sm text-neutral-500 mt-1">
          Review all tender details before publishing
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content - Left Column (2/3) */}
        <div className="col-span-2 space-y-6">
          {/* Tender Document Preview */}
          <div className="bg-white border-2 border-neutral-300 rounded-lg overflow-hidden">
            {/* Document Header */}
            <div className="bg-neutral-900 text-white px-8 py-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5" />
                    <span className="text-xs uppercase tracking-wide text-neutral-400">
                      Official Tender Document
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold mb-2">
                    {data?.basicInfo?.title || "Untitled Tender"}
                  </h1>
                  <p className="text-sm text-neutral-300">
                    {data?.basicInfo?.description || "No description provided"}
                  </p>
                </div>
              </div>
            </div>

            {/* Metadata Section */}
            <div className="px-8 py-6 bg-neutral-50 border-b border-neutral-200">
              <h3 className="text-xs uppercase tracking-wide font-semibold text-neutral-700 mb-4">
                Tender Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Building className="w-4 h-4 text-neutral-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-neutral-500">Issuing Organization</p>
                    <p className="text-sm font-medium text-neutral-900 mt-0.5">
                      {data?.basicInfo?.issuingOrganization || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Tag className="w-4 h-4 text-neutral-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-neutral-500">Category</p>
                    <p className="text-sm font-medium text-neutral-900 mt-0.5">
                      {data?.basicInfo?.category || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-neutral-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-neutral-500">Submission Deadline</p>
                    <p className="text-sm font-medium text-neutral-900 mt-0.5">
                      {data?.basicInfo?.submissionDeadline 
                        ? new Date(data.basicInfo.submissionDeadline).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : "Not specified"}
                    </p>
                  </div>
                </div>

                {data?.basicInfo?.estimatedValue && (
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-4 h-4 text-neutral-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-neutral-500">Estimated Value</p>
                      <p className="text-sm font-medium text-neutral-900 mt-0.5">
                        ₹ {Number(data.basicInfo.estimatedValue).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sections Content */}
            <div className="px-8 py-6">
              <h3 className="text-xs uppercase tracking-wide font-semibold text-neutral-700 mb-4">
                Tender Document Sections
              </h3>
              
              {data?.sections && data.sections.length > 0 ? (
                <div className="space-y-6">
                  {data.sections.map((section, index) => (
                    <div key={section.id} className="pb-6 border-b border-neutral-200 last:border-b-0 last:pb-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-neutral-500">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <h4 className="text-base font-semibold text-neutral-900">
                            {section.title}
                          </h4>
                          {section.mandatory && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded text-xs font-medium text-amber-700">
                              <Lock className="w-3 h-3" />
                              Mandatory
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {section.content ? (
                        <div className="prose prose-sm max-w-none">
                          <p className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">
                            {section.content}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-red-50 border border-red-200 rounded px-3 py-2">
                          <p className="text-sm text-red-700">
                            ⚠️ No content provided for this section
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-neutral-50 rounded-lg border border-neutral-200">
                  <p className="text-sm text-neutral-500">No sections created</p>
                </div>
              )}
            </div>

            {/* Document Footer */}
            <div className="px-8 py-4 bg-neutral-50 border-t border-neutral-200">
              <p className="text-xs text-neutral-500 text-center">
                This is a preview of how the tender document will appear to bidders
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar - Right Column (1/3) */}
        <div className="col-span-1 space-y-6">
          {/* Validation Checklist */}
          <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200">
              <h3 className="text-sm font-semibold text-neutral-900">
                Validation Checklist
              </h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {Object.entries(validationChecks).map(([key, check]) => (
                  <div key={key} className="flex items-start gap-2">
                    {check.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={`text-sm ${
                      check.passed ? "text-neutral-700" : "text-red-700 font-medium"
                    }`}>
                      {check.label}
                    </span>
                  </div>
                ))}
              </div>

              {allValid ? (
                <div className="mt-4 pt-4 border-t border-neutral-200">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-semibold">All checks passed</span>
                  </div>
                </div>
              ) : (
                <div className="mt-4 pt-4 border-t border-neutral-200">
                  <div className="flex items-start gap-2 text-red-700">
                    <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">
                      Fix all issues before publishing
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-red-50 border-2 border-red-300 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-red-100 border-b border-red-300">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-700" />
                <h3 className="text-sm font-bold text-red-900">
                  IMPORTANT WARNING
                </h3>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-red-900 font-medium leading-relaxed">
                Once published, this tender cannot be edited or deleted. The document will be locked and made available to bidders immediately.
              </p>
              <p className="text-xs text-red-800 mt-3">
                Ensure all information is accurate and complete before proceeding.
              </p>
            </div>
          </div>

          {/* Publish Button */}
          <button
            onClick={handlePublish}
            disabled={!allValid || isPublishing}
            className="w-full px-6 py-3.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            {isPublishing ? "Publishing..." : "Publish Tender"}
          </button>

          {!allValid && (
            <p className="text-xs text-center text-neutral-500">
              Complete all validation checks to enable publishing
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
