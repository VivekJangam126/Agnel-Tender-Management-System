import { useState } from "react";
import Stepper from "./components/Stepper";
import StepBasicInfo from "./components/StepBasicInfo";
import StepContentBuilder from "./components/StepContentBuilder";
import StepReviewPublish from "./components/StepReviewPublish";

const STEPS = [
  { id: 1, label: "Basic Information" },
  { id: 2, label: "Content Builder" },
  { id: 3, label: "Review & Publish" },
];

export default function TenderCreate() {
  const [currentStep, setCurrentStep] = useState(1);
  const [tenderDraft, setTenderDraft] = useState({
    basicInfo: {},
    sections: [],
    metadata: {},
  });
  const [isStepValid, setIsStepValid] = useState(false);

  const handleNext = () => {
    if (currentStep < STEPS.length && isStepValid) {
      setCurrentStep(currentStep + 1);
      setIsStepValid(false); // Reset validation for next step
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateTenderDraft = (field, value) => {
    setTenderDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepBasicInfo
            data={tenderDraft.basicInfo}
            onUpdate={(data) => updateTenderDraft("basicInfo", data)}
            onValidationChange={setIsStepValid}
          />
        );
      case 2:
        return (
          <StepContentBuilder
            data={tenderDraft.sections}
            onUpdate={(data) => updateTenderDraft("sections", data)}
            onValidationChange={setIsStepValid}
            tenderMetadata={tenderDraft.basicInfo}
          />
        );
      case 3:
        return (
          <StepReviewPublish
            data={tenderDraft}
            onUpdate={updateTenderDraft}
            onValidationChange={setIsStepValid}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white sticky top-0 z-10">
        <div className="px-8 py-6">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Create New Tender
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Follow the steps to create and publish your tender
          </p>
        </div>

        {/* Stepper */}
        <div className="px-8 pb-6">
          <Stepper steps={STEPS} currentStep={currentStep} />
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">
          {renderStepContent()}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="border-t border-neutral-200 bg-white sticky bottom-0">
        <div className="max-w-5xl mx-auto px-8 py-4 flex justify-between items-center">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="px-5 py-2.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Back
          </button>

          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-500">
              Step {currentStep} of {STEPS.length}
            </span>
            <button
              onClick={handleNext}
              disabled={currentStep === STEPS.length || !isStepValid}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {currentStep === STEPS.length ? "Review Complete" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
