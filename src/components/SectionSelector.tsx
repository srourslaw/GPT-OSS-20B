import React, { useState } from 'react';
import { ChevronRight, ChevronDown, CheckSquare, Square, ChevronsDown, ChevronsRight, X } from 'lucide-react';
import { DocumentSection } from '../types';

interface SectionSelectorProps {
  sections: DocumentSection[];
  onSectionsChange: (sections: DocumentSection[]) => void;
  onSectionClick?: (sectionId: string) => void;
}

const SectionSelector: React.FC<SectionSelectorProps> = ({ sections, onSectionsChange, onSectionClick }) => {
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

  // Collect all section IDs recursively
  const collectAllSectionIds = (secs: DocumentSection[]): string[] => {
    const ids: string[] = [];
    const collect = (sections: DocumentSection[]) => {
      sections.forEach(section => {
        ids.push(section.id);
        if (section.children) {
          collect(section.children);
        }
      });
    };
    collect(secs);
    return ids;
  };

  const expandAll = () => {
    const allIds = collectAllSectionIds(sections);
    setExpandedSections(new Set(allIds));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  const allExpanded = sections.length > 0 && expandedSections.size > 0 && expandedSections.size === collectAllSectionIds(sections).length;

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
            onClick={() => {
              console.log('🖱️ Section clicked:', section.id, section.title);
              handleToggle(section.id);
              if (onSectionClick) {
                console.log('🔔 Calling onSectionClick callback');
                onSectionClick(section.id);
              } else {
                console.log('⚠️ onSectionClick callback not provided');
              }
            }}
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
      {/* Header with controls */}
      <div className="px-2 py-2 border-b border-gray-200 bg-gray-50 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700">Sections</span>
          <div className="flex gap-1">
            <button
              onClick={selectAll}
              className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors font-medium"
              title="Select all sections"
            >
              All
            </button>
            <button
              onClick={deselectAll}
              className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors font-medium"
              title="Deselect all sections"
            >
              None
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between gap-1">
          <button
            onClick={allExpanded ? collapseAll : expandAll}
            className="text-xs px-2 py-1 text-purple-600 hover:bg-purple-50 rounded transition-colors flex items-center gap-1 font-medium border border-purple-200"
            title={allExpanded ? "Collapse all sections" : "Expand all sections"}
          >
            {allExpanded ? (
              <>
                <ChevronsRight className="h-3 w-3" />
                Collapse All
              </>
            ) : (
              <>
                <ChevronsDown className="h-3 w-3" />
                Expand All
              </>
            )}
          </button>
          <button
            onClick={deselectAll}
            className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors flex items-center gap-1 font-medium border border-red-200"
            title="Clear all section selections"
          >
            <X className="h-3 w-3" />
            Clear All
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
