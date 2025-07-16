import React from 'react';
import { X, FileText, ExternalLink, Download } from 'lucide-react';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
  activityTitle: string;
}

function extractDocumentNameFromSharePointUrl(url: string): string {
  try {
    // Extract filename from SharePoint URL
    const urlParts = url.split('/');
    const filenamePart = urlParts.find(part => part.includes('.docx') || part.includes('.pdf') || part.includes('.doc'));
    
    if (filenamePart) {
      // Decode URL encoding and clean up
      const decoded = decodeURIComponent(filenamePart);
      // Remove any query parameters
      const cleanName = decoded.split('?')[0];
      return cleanName;
    }
    
    // Fallback: try to extract from the path
    if (url.includes('eJournal')) {
      if (url.includes('Inloggen')) {
        return 'Inloggen in eJournal.docx';
      } else if (url.includes('Instructie') && url.includes('Plagiaatcontrole')) {
        return 'Instructie eJournal student - Plagiaatcontrole.pdf';
      }
    }
    
    return 'SharePoint Document';
  } catch (error) {
    return 'SharePoint Document';
  }
}

function isSharePointUrl(url: string): boolean {
  return url.includes('sharepoint.com') || url.startsWith('https://');
}

function isLocalDocument(documentName: string): boolean {
  // Check if it's a simple filename that should reference a local PDF
  return documentName.toLowerCase().includes('inloggen in ejournal') && !documentName.startsWith('http');
}

function getLocalDocumentPath(documentName: string): string {
  // Map local document names to actual PDF files
  if (documentName.toLowerCase().includes('inloggen in ejournal')) {
    return '/Inloggen in eJournal.pdf';
  }
  return documentName;
}

export function DocumentModal({ isOpen, onClose, documentName, activityTitle }: DocumentModalProps) {
  if (!isOpen) return null;

  const isLocal = isLocalDocument(documentName);
  const isSharePoint = !isLocal && isSharePointUrl(documentName);
  
  let displayName: string;
  let documentPath: string;
  
  if (isLocal) {
    displayName = 'Inloggen in eJournal.pdf';
    documentPath = getLocalDocumentPath(documentName);
  } else if (isSharePoint) {
    displayName = extractDocumentNameFromSharePointUrl(documentName);
    documentPath = documentName;
  } else {
    displayName = documentName;
    documentPath = documentName;
  }

  const isPdf = displayName.toLowerCase().endsWith('.pdf');
  const isDocx = displayName.toLowerCase().endsWith('.docx') || displayName.toLowerCase().endsWith('.doc');

  const handleOpenInNewTab = () => {
    if (isSharePoint) {
      window.open(documentPath, '_blank', 'noopener,noreferrer');
    } else {
      // For local files, open in new tab
      window.open(documentPath, '_blank');
    }
  };

  const handleDownload = () => {
    if (isSharePoint) {
      // For SharePoint, we can't directly download, so open in new tab
      handleOpenInNewTab();
    } else {
      // For local files, create a download link
      const link = document.createElement('a');
      link.href = documentPath;
      link.download = displayName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-[98vw] max-h-[98vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0 bg-gray-50 rounded-t-lg">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{displayName}</h2>
              <p className="text-sm text-gray-600">Voor activiteit: {activityTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isLocal && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            )}
            <button
              onClick={handleOpenInNewTab}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              {isSharePoint ? 'Open in SharePoint' : 'Open in nieuw tabblad'}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          {isSharePoint ? (
            <div className="h-full flex items-center justify-center p-12">
              <div className="text-center bg-white rounded-lg p-8 shadow-lg max-w-md">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">SharePoint Document</h3>
                <p className="text-gray-600 mb-6">
                  Dit document wordt gehost op SharePoint. Klik op "Open in SharePoint" om het document te bekijken in een nieuw tabblad.
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={handleOpenInNewTab}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Open in SharePoint
                  </button>
                  
                  <div className="text-sm text-gray-500">
                    <p className="font-medium mb-1">Document type:</p>
                    <p className="flex items-center justify-center gap-2">
                      <FileText className="w-4 h-4" />
                      {isPdf ? 'PDF Document' : isDocx ? 'Word Document' : 'Document'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : isPdf && isLocal ? (
            <div className="w-full h-full p-4">
              <iframe
                src={documentPath}
                className="w-full h-full border-0 rounded-lg shadow-inner bg-white"
                title={displayName}
                style={{ 
                  minHeight: 'calc(100vh - 200px)',
                  height: '100%'
                }}
              />
            </div>
          ) : isDocx ? (
            <div className="h-full flex items-center justify-center p-12">
              <div className="text-center bg-white rounded-lg p-8 shadow-lg">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Word Document</h3>
                <p className="text-gray-600 mb-6">
                  Dit Word document kan niet direct in de browser worden weergegeven.
                </p>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download om te openen
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-12">
              <div className="text-center bg-white rounded-lg p-8 shadow-lg">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Document</h3>
                <p className="text-gray-600 mb-6">
                  Dit document kan niet direct in de browser worden weergegeven.
                </p>
                <button
                  onClick={handleOpenInNewTab}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                  Open document
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}