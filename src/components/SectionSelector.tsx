import React, { useState } from 'react';
import { ChevronRight, ChevronDown, CheckSquare, Square } from 'lucide-react';
import { DocumentSection } from '../types';

interface SectionSelectorProps {
  sections: DocumentSection[];
  onSectionsChange: (sections: DocumentSection[]) => void;
}

const SectionSelector: React.FC<SectionSelectorProps> = ({ sections, onSectionsChange }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleExpand = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const toggleSection = (sectionId: string, sections: DocumentSection[]): DocumentSection[] => {
    return sections.map(section => {
      if (section.id === sectionId) {
        const newSelected = !section.selected;
        // If toggling, also toggle all children
        const updateChildren = (sec: DocumentSection): DocumentSection => ({
          ...sec,
          selected: newSelected,
          children: sec.children?.map(updateChildren)
        });
        return updateChildren({ ...section, selected: newSelected });
      }
      if (section.children) {
        return {
          ...section,
          children: toggleSection(sectionId, section.children)
        };
      }
      return section;
    });
  };

  const handleToggle = (sectionId: string) => {
    const newSections = toggleSection(sectionId, sections);
    onSectionsChange(newSections);
  };

  const selectAll = () => {
    const updateAll = (sections: DocumentSection[]): DocumentSection[] => {
      return sections.map(section => ({
        ...section,
        selected: true,
        children: section.children ? updateAll(section.children) : undefined
      }));
    };
    onSectionsChange(updateAll(sections));
  };

  const deselectAll = () => {
    const updateAll = (sections: DocumentSection[]): DocumentSection[] => {
      return sections.map(section => ({
        ...section,
        selected: false,
        children: section.children ? updateAll(section.children) : undefined
      }));
    };
    onSectionsChange(updateAll(sections));
  };

  const renderSection = (section: DocumentSection, level: number = 0) => {
    const hasChildren = section.children && section.children.length > 0;
    const isExpanded = expandedSections.has(section.id);
    const indentation = level * 16;

    return (
      <div key={section.id} className="select-none">
        <div
          className="flex items-center py-1.5 px-2 hover:bg-gray-50 rounded cursor-pointer group"
          style={{ paddingLeft: `${indentation + 8}px` }}
        >
          {/* Expand/Collapse icon */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(section.id);
              }}
              className="mr-1 p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-gray-600" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-gray-600" />
              )}
            </button>
          ) : (
            <span className="w-5" /> // Spacer for alignment
          )}

          {/* Checkbox */}
          <button
            onClick={() => handleToggle(section.id)}
            className="mr-2 flex-shrink-0"
          >
            {section.selected ? (
              <CheckSquare className="h-4 w-4 text-blue-600" />
            ) : (
              <Square className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
            )}
          </button>

          {/* Section title */}
          <div
            onClick={() => handleToggle(section.id)}
            className="flex-1 min-w-0"
          >
            <p className={`text-sm truncate ${
              section.selected ? 'text-gray-900 font-medium' : 'text-gray-600'
            }`}>
              {section.title}
            </p>
          </div>
        </div>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div>
            {section.children!.map(child => renderSection(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (sections.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">No sections detected</p>
        <p className="text-xs mt-1">Document will be used as a whole</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with select all/none buttons */}
      <div className="flex items-center justify-between px-2 py-2 border-b border-gray-200 bg-gray-50">
        <span className="text-xs font-semibold text-gray-700">Sections</span>
        <div className="flex gap-1">
          <button
            onClick={selectAll}
            className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            All
          </button>
          <button
            onClick={deselectAll}
            className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            None
          </button>
        </div>
      </div>

      {/* Sections tree */}
      <div className="flex-1 overflow-y-auto py-2">
        {sections.map(section => renderSection(section, 0))}
      </div>
    </div>
  );
};

export default SectionSelector;
