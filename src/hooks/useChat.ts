import { useState, useCallback } from 'react';
import { chatService, type CreateRoomRequest, type ChatRoom, type Message } from '../services/chat.service';
import { mediaService, type MediaItem } from '../services/media.service';
import { type MemberStatus } from '../services/member.service';
import { type User } from '../services/auth.service';

export const useChat = (
  currentFamily: MemberStatus | null,
  user: User | null,
  onMessagesUpdate: (messages: Message[]) => void,
  onRoomsUpdate: (rooms: ChatRoom[]) => void,
  onMediaUpdate: () => void
) => {
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  // Room Management
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showRoomSettingsModal, setShowRoomSettingsModal] = useState(false);
  const [roomFormData, setRoomFormData] = useState<CreateRoomRequest>({
    familyId: 0,
    name: '',
    description: '',
    isPrivate: false,
    participantIds: []
  });
  const [editingRoom, setEditingRoom] = useState<ChatRoom | null>(null);
  const [participantToAdd, setParticipantToAdd] = useState<number | null>(null);

  // Avatar Upload
  const [createRoomAvatarFile, setCreateRoomAvatarFile] = useState<File | null>(null);
  const [editRoomAvatarFile, setEditRoomAvatarFile] = useState<File | null>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      alert("Le fichier est trop volumineux. Taille maximale : 50MB");
      return;
    }

    setPendingFiles(prev => [...prev, file]);
    event.target.value = '';
  }, []);

  const handleSendMessage = useCallback(async (
    e: React.FormEvent,
    messages: Message[]
  ) => {
    e.preventDefault();
    if ((!newMessage.trim() && pendingFiles.length === 0) || !activeRoomId || !currentFamily) return;
    
    try {
      setIsUploading(true);
      
      // Upload files
      const uploadedMedia: MediaItem[] = [];
      for (let i = 0; i < pendingFiles.length; i++) {
        const file = pendingFiles[i];
        const media = await mediaService.uploadFile(
          file,
          currentFamily.familyId,
          undefined,
          undefined,
          (progress: number) => {
            const globalProgress = Math.round(((i * 100) + progress) / pendingFiles.length);
            setUploadProgress(globalProgress);
          }
        );
        uploadedMedia.push(media);
      }
      
      const attachmentIds = uploadedMedia.map(m => m.id);

      // Optimistic update
      const tempMsg: Message = {
        id: Date.now(),
        content: newMessage,
        sentAt: new Date().toISOString(),
        sender: { 
          id: user?.id || 0, 
          displayName: user?.displayName || user?.email || 'Moi', 
          email: user?.email || '' 
        },
        attachments: uploadedMedia
      };
      
      onMessagesUpdate([...messages, tempMsg]);
      setNewMessage('');
      setPendingFiles([]);

      // Send to server
      await chatService.sendMessage({ 
        chatRoomId: activeRoomId, 
        content: tempMsg.content,
        attachmentIds: attachmentIds.length > 0 ? attachmentIds : undefined
      });
      
      if (uploadedMedia.length > 0) {
        onMediaUpdate();
      }
      
    } catch (err) {
      console.error("Failed to send message", err);
      alert("Erreur lors de l'envoi du message. Vérifiez votre connexion.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [newMessage, pendingFiles, activeRoomId, currentFamily, user, onMessagesUpdate, onMediaUpdate]);

  const handleCreateRoom = useCallback(async (chatRooms: ChatRoom[]) => {
    if (!currentFamily) return;

    try {
      let avatarUrl = roomFormData.avatarUrl;

      if (createRoomAvatarFile) {
        const uploaded = await mediaService.uploadFile(createRoomAvatarFile, currentFamily.familyId);
        avatarUrl = uploaded.urlPath;
      }

      const newRoom = await chatService.createRoom({
        ...roomFormData,
        avatarUrl,
        familyId: currentFamily.familyId
      });
      
      onRoomsUpdate([...chatRooms, newRoom]);
      setShowCreateRoomModal(false);
      setActiveRoomId(newRoom.id);
      
      // Reset form
      setRoomFormData({ familyId: 0, name: '', description: '', isPrivate: false, participantIds: [] });
      setCreateRoomAvatarFile(null);
    } catch (err) {
      console.error("Create room error", err);
      alert("Erreur lors de la création du salon.");
    }
  }, [currentFamily, roomFormData, createRoomAvatarFile, onRoomsUpdate]);

  const handleUpdateRoom = useCallback(async (chatRooms: ChatRoom[]) => {
    if (!editingRoom || !currentFamily) return;
    
    try {
      let avatarUrl = editingRoom.avatarUrl;

      if (editRoomAvatarFile) {
        const uploaded = await mediaService.uploadFile(editRoomAvatarFile, currentFamily.familyId);
        avatarUrl = uploaded.urlPath;
      }

      const updated = await chatService.updateRoom({
        chatRoomId: editingRoom.id,
        name: editingRoom.name,
        description: editingRoom.description,
        channelType: editingRoom.channelType,
        avatarUrl
      });
      
      onRoomsUpdate(chatRooms.map(r => r.id === updated.id ? updated : r));
      setEditingRoom(updated); 
      setEditRoomAvatarFile(null);
      alert("Salon mis à jour !");
    } catch (err) {
      console.error("Update room error", err);
      alert("Erreur lors de la mise à jour.");
    }
  }, [editingRoom, currentFamily, editRoomAvatarFile, onRoomsUpdate]);

  return {
    // State
    activeRoomId,
    newMessage,
    pendingFiles,
    uploadProgress,
    isUploading,
    showCreateRoomModal,
    showRoomSettingsModal,
    roomFormData,
    editingRoom,
    participantToAdd,
    createRoomAvatarFile,
    editRoomAvatarFile,
    
    // Setters
    setActiveRoomId,
    setNewMessage,
    setPendingFiles,
    setShowCreateRoomModal,
    setShowRoomSettingsModal,
    setRoomFormData,
    setEditingRoom,
    setParticipantToAdd,
    setCreateRoomAvatarFile,
    setEditRoomAvatarFile,
    
    // Actions
    handleFileSelect,
    handleSendMessage,
    handleCreateRoom,
    handleUpdateRoom
  };
};