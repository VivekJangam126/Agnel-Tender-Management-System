import { useState, useEffect } from "react";
import SectionList from "./SectionList";
import SectionEditor from "./SectionEditor";
import AIChatPanel from "../../../../components/shared/AIChat/AIChatPanel";

export default function StepContentBuilder({ data, onUpdate, onValidationChange, tenderMetadata }) {
  const [sections, setSections] = useState(data || []);
  const [selectedSectionId, setSelectedSectionId] = useState(null);

  // Initialize with default sections if empty
  useEffect(() => {
    if (sections.length === 0) {
      const defaultSections = [
        { id: 1, title: "Introduction", content: "", mandatory: true, order: 1 },
        { id: 2, title: "Scope of Work", content: "", mandatory: true, order: 2 },
        { id: 3, title: "Eligibility Criteria", content: "", mandatory: true, order: 3 },
        { id: 4, title: "Submission Guidelines", content: "", mandatory: true, order: 4 },
      ];
      setSections(defaultSections);
    }
  }, []);

  // Validate sections
  useEffect(() => {
    const hasAtLeastOne = sections.length > 0;
    const mandatorySectionsFilled = sections
      .filter(s => s.mandatory)
      .every(s => s.content && s.content.trim().length > 0);
    
    const isValid = hasAtLeastOne && mandatorySectionsFilled;
    
    if (onValidationChange) {
      onValidationChange(isValid);
    }
    
    onUpdate(sections);
  }, [sections]);

  const handleAddSection = () => {
    const newSection = {
      id: Date.now(),
      title: `Section ${sections.length + 1}`,
      content: "",
      mandatory: false,
      order: sections.length + 1,
    };
    setSections([...sections, newSection]);
    setSelectedSectionId(newSection.id);
  };

  const handleUpdateSection = (id, updates) => {
    setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleDeleteSection = (id) => {
    const section = sections.find(s => s.id === id);
    if (section?.mandatory) {
      alert("Cannot delete mandatory sections");
      return;
    }
    setSections(sections.filter(s => s.id !== id));
    if (selectedSectionId === id) {
      setSelectedSectionId(null);
    }
  };

  const handleReorder = (id, direction) => {
    const index = sections.findIndex(s => s.id === id);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === sections.length - 1)
    ) {
      return;
    }

    const newSections = [...sections];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [newSections[index], newSections[swapIndex]] = [newSections[swapIndex], newSections[index]];
    
    // Update order numbers
    newSections.forEach((s, i) => {
      s.order = i + 1;
    });
    
    setSections(newSections);
  };

  const selectedSection = sections.find(s => s.id === selectedSectionId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">
          Content Builder
        </h2>
        <p className="text-sm text-neutral-500 mt-1">
          Build your tender document with sections and AI assistance
        </p>
      </div>

      {/* Three Panel Layout */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="grid grid-cols-12 divide-x divide-neutral-200" style={{ minHeight: "600px" }}>
          {/* Left Panel - Section List */}
          <div className="col-span-3 bg-neutral-50">
            <SectionList
              sections={sections}
              selectedId={selectedSectionId}
              onSelect={setSelectedSectionId}
              onAdd={handleAddSection}
              onUpdate={handleUpdateSection}
              onDelete={handleDeleteSection}
              onReorder={handleReorder}
            />
          </div>

          {/* Center Panel - Section Editor */}
          <div className="col-span-6 bg-white">
            <SectionEditor
              section={selectedSection}
              onUpdate={(updates) => handleUpdateSection(selectedSectionId, updates)}
              tenderTitle={tenderMetadata?.title}
            />
          </div>

          {/* Right Panel - AI Assistant */}
          <div className="col-span-3 bg-neutral-50">
            <AIChatPanel
              context={{
                tenderMetadata,
                selectedSection,
                allSections: sections,
              }}
            />
          </div>
        </div>
      </div>

      {/* Validation Info */}
      {sections.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                Content Building Progress
              </p>
              <ul className="mt-2 text-xs text-blue-800 space-y-1">
                <li>• Total sections: {sections.length}</li>
                <li>• Mandatory sections: {sections.filter(s => s.mandatory).length}</li>
                <li>• Completed mandatory: {sections.filter(s => s.mandatory && s.content?.trim()).length}</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
