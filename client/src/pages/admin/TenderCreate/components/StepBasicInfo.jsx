import { useState, useEffect } from "react";

const CATEGORIES = [
  "Construction & Infrastructure",
  "IT & Software Development",
  "Consulting Services",
  "Supply & Procurement",
  "Healthcare & Medical",
  "Education & Training",
  "Security Services",
  "Maintenance & Facilities",
  "Other",
];

export default function StepBasicInfo({ data, onUpdate, onValidationChange }) {
  const [formData, setFormData] = useState({
    title: data?.title || "",
    description: data?.description || "",
    category: data?.category || "",
    estimatedValue: data?.estimatedValue || "",
    submissionDeadline: data?.submissionDeadline || "",
    issuingOrganization: "Government of Maharashtra", // Mock read-only
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Validation logic
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Tender title is required";
    } else if (formData.title.length < 10) {
      newErrors.title = "Title must be at least 10 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Short description is required";
    } else if (formData.description.length > 300) {
      newErrors.description = "Description must not exceed 300 characters";
    } else if (formData.description.length < 20) {
      newErrors.description = "Description must be at least 20 characters";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    if (!formData.submissionDeadline) {
      newErrors.submissionDeadline = "Submission deadline is required";
    } else {
      const selectedDate = new Date(formData.submissionDeadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.submissionDeadline = "Deadline cannot be in the past";
      }
    }

    if (formData.estimatedValue && isNaN(Number(formData.estimatedValue))) {
      newErrors.estimatedValue = "Please enter a valid number";
    }

    setErrors(newErrors);
    
    // Notify parent of validation state
    const isValid = Object.keys(newErrors).length === 0;
    if (onValidationChange) {
      onValidationChange(isValid);
    }
    
    return isValid;
  };

  // Run validation whenever form data changes
  useEffect(() => {
    validateForm();
    onUpdate(formData);
  }, [formData]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  const showError = (field) => touched[field] && errors[field];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">
          Basic Information
        </h2>
        <p className="text-sm text-neutral-500 mt-1">
          Enter the fundamental details about your tender
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white border border-neutral-200 rounded-lg">
        <div className="p-6 space-y-6">
          {/* Issuing Organization - Read Only */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Issuing Organization
            </label>
            <input
              type="text"
              value={formData.issuingOrganization}
              readOnly
              className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-500 cursor-not-allowed"
            />
            <p className="text-xs text-neutral-500 mt-1.5">
              Your organization details (read-only)
            </p>
          </div>

          {/* Tender Title */}
          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">
              Tender Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              onBlur={() => handleBlur("title")}
              placeholder="e.g., Supply of Medical Equipment for District Hospital"
              className={`w-full px-4 py-2.5 border rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 transition-colors ${
                showError("title")
                  ? "border-red-300 focus:ring-red-100 focus:border-red-400"
                  : "border-neutral-300 focus:ring-blue-100 focus:border-blue-500"
              }`}
            />
            {showError("title") && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.title}
              </p>
            )}
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">
              Short Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              onBlur={() => handleBlur("description")}
              placeholder="Brief overview of the tender scope and objectives"
              rows={4}
              maxLength={300}
              className={`w-full px-4 py-2.5 border rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 transition-colors resize-none ${
                showError("description")
                  ? "border-red-300 focus:ring-red-100 focus:border-red-400"
                  : "border-neutral-300 focus:ring-blue-100 focus:border-blue-500"
              }`}
            />
            <div className="flex items-center justify-between mt-1.5">
              {showError("description") ? (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.description}
                </p>
              ) : (
                <p className="text-xs text-neutral-500">
                  Provide a clear, concise summary
                </p>
              )}
              <p className={`text-xs ${formData.description.length > 300 ? 'text-red-600' : 'text-neutral-500'}`}>
                {formData.description.length} / 300
              </p>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">
              Category / Domain <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange("category", e.target.value)}
              onBlur={() => handleBlur("category")}
              className={`w-full px-4 py-2.5 border rounded-lg text-neutral-900 focus:outline-none focus:ring-2 transition-colors ${
                showError("category")
                  ? "border-red-300 focus:ring-red-100 focus:border-red-400"
                  : "border-neutral-300 focus:ring-blue-100 focus:border-blue-500"
              }`}
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {showError("category") && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.category}
              </p>
            )}
          </div>

          {/* Two Column Layout for Value and Deadline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Estimated Value */}
            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                Estimated Value (₹)
              </label>
              <input
                type="text"
                value={formData.estimatedValue}
                onChange={(e) => handleChange("estimatedValue", e.target.value)}
                onBlur={() => handleBlur("estimatedValue")}
                placeholder="e.g., 5000000"
                className={`w-full px-4 py-2.5 border rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 transition-colors ${
                  showError("estimatedValue")
                    ? "border-red-300 focus:ring-red-100 focus:border-red-400"
                    : "border-neutral-300 focus:ring-blue-100 focus:border-blue-500"
                }`}
              />
              {showError("estimatedValue") ? (
                <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.estimatedValue}
                </p>
              ) : (
                <p className="text-xs text-neutral-500 mt-1.5">
                  Optional - Enter approximate budget
                </p>
              )}
            </div>

            {/* Submission Deadline */}
            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                Submission Deadline <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.submissionDeadline}
                onChange={(e) => handleChange("submissionDeadline", e.target.value)}
                onBlur={() => handleBlur("submissionDeadline")}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-2.5 border rounded-lg text-neutral-900 focus:outline-none focus:ring-2 transition-colors ${
                  showError("submissionDeadline")
                    ? "border-red-300 focus:ring-red-100 focus:border-red-400"
                    : "border-neutral-300 focus:ring-blue-100 focus:border-blue-500"
                }`}
              />
              {showError("submissionDeadline") && (
                <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.submissionDeadline}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Validation Summary */}
      {Object.keys(errors).length > 0 && Object.keys(touched).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-900">
                Please fix the following errors:
              </p>
              <ul className="mt-2 text-xs text-amber-800 space-y-1">
                {Object.entries(errors).map(([field, message]) => (
                  <li key={field}>• {message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
