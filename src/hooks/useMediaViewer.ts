import { useState, useCallback } from 'react';

export const useMediaViewer = () => {
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [mediaViewerIndex, setMediaViewerIndex] = useState(0);
  const [mediaViewerList, setMediaViewerList] = useState<any[]>([]);

  const openMediaViewer = useCallback((media: any, mediaList: any[], index: number) => {
    setSelectedMedia(media);
    setMediaViewerList(mediaList);
    setMediaViewerIndex(index);
    setShowMediaViewer(true);
  }, []);

  const closeMediaViewer = useCallback(() => {
    setShowMediaViewer(false);
    setSelectedMedia(null);
    setMediaViewerList([]);
    setMediaViewerIndex(0);
  }, []);

  const navigateMedia = useCallback((direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' 
      ? (mediaViewerIndex - 1 + mediaViewerList.length) % mediaViewerList.length
      : (mediaViewerIndex + 1) % mediaViewerList.length;
    
    setMediaViewerIndex(newIndex);
    setSelectedMedia(mediaViewerList[newIndex]);
  }, [mediaViewerIndex, mediaViewerList]);

  return {
    // State
    showMediaViewer,
    selectedMedia,
    mediaViewerIndex,
    mediaViewerList,
    
    // Actions
    openMediaViewer,
    closeMediaViewer,
    navigateMedia
  };
};