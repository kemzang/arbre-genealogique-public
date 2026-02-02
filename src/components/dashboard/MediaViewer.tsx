import { memo } from 'react';
import { X, ChevronLeft, ChevronRight, Download, FileText } from 'lucide-react';

interface MediaViewerProps {
  showMediaViewer: boolean;
  selectedMedia: any;
  mediaViewerIndex: number;
  mediaViewerList: any[];
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  getMediaUrl: (urlPath: string) => string;
}

export const MediaViewer = memo(({
  showMediaViewer,
  selectedMedia,
  mediaViewerIndex,
  mediaViewerList,
  onClose,
  onNavigate,
  getMediaUrl
}: MediaViewerProps) => {
  if (!showMediaViewer || !selectedMedia) return null;

  return (
    <div className="modal-overlay media-viewer-overlay" onClick={onClose}>
      <div className="media-viewer-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn media-viewer-close" onClick={onClose}>
          <X size={24} />
        </button>
        
        {mediaViewerList.length > 1 && (
          <>
            <button className="nav-btn prev-btn" onClick={() => onNavigate('prev')}>
              <ChevronLeft size={32} />
            </button>
            <button className="nav-btn next-btn" onClick={() => onNavigate('next')}>
              <ChevronRight size={32} />
            </button>
          </>
        )}
        
        <div className="media-viewer-content">
          {selectedMedia.mediaType === 'IMAGE' ? (
            <img 
              src={getMediaUrl(selectedMedia.urlPath)} 
              alt="Media viewer"
              className="media-viewer-image"
            />
          ) : selectedMedia.mediaType === 'VIDEO' ? (
            <video 
              src={getMediaUrl(selectedMedia.urlPath)} 
              controls 
              className="media-viewer-video"
              autoPlay
            />
          ) : (
            <div className="media-viewer-file">
              <FileText size={64} color="#666" />
              <h3>{selectedMedia.originalName || 'Fichier'}</h3>
              <a 
                href={getMediaUrl(selectedMedia.urlPath)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="download-btn"
              >
                <Download size={20} />
                Télécharger
              </a>
            </div>
          )}
        </div>
        
        {mediaViewerList.length > 1 && (
          <div className="media-viewer-counter">
            {mediaViewerIndex + 1} / {mediaViewerList.length}
          </div>
        )}
      </div>
    </div>
  );
});