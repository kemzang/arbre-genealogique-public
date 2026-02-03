import { useState, useCallback } from 'react';
import { memberService, type MemberStatus } from '../services/member.service';
import { treeService, type TreeData } from '../services/tree.service';
import { chatService, type ChatRoom, type Message } from '../services/chat.service';
import { mediaService, type MediaItem } from '../services/media.service';
import { eventService, type FamilyEvent } from '../services/event.service';
import { multiFamilyService, type FamilyMergeRequest } from '../services/multi-family.service';

export const useFamilyData = () => {
  const [userFamilies, setUserFamilies] = useState<MemberStatus[]>([]);
  const [currentFamily, setCurrentFamily] = useState<MemberStatus | null>(null);
  const [treeData, setTreeData] = useState<TreeData | null>(null);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [familyEvents, setFamilyEvents] = useState<FamilyEvent[]>([]);
  const [pendingFusionRequests, setPendingFusionRequests] = useState<FamilyMergeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFamilyData = useCallback(async (familyId: number) => {
    try {
      const [tree, rooms, media, events] = await Promise.all([
        treeService.getTree(familyId),
        chatService.getChatRooms(familyId),
        mediaService.getRecentMedia(familyId),
        eventService.getFamilyEvents(familyId)
      ]);

      setTreeData(tree);
      setChatRooms(rooms);
      setMediaList(media);
      setFamilyEvents(events);

      // Charger les messages du premier salon
      if (rooms.length > 0) {
        const msgs = await chatService.getMessages(rooms[0].id);
        setMessages(msgs);
      }

      // Charger les demandes de fusion (TODO: implémenter l'endpoint)
      setPendingFusionRequests([]);
      
    } catch (err) {
      console.error("Error loading family data:", err);
    }
  }, []);

  const initializeFamilies = useCallback(async () => {
    try {
      setIsLoading(false);
      setTreeData({ persons: [], relationships: [] });
      setChatRooms([]);
      setMessages([]);
      setMediaList([]);

      const statuses = await memberService.getMemberStatus();
      if (Array.isArray(statuses)) {
        setUserFamilies(statuses);
        const active = statuses.find(s => s.status === 'ACTIVE');
        if (active) {
          setCurrentFamily(active);
          await loadFamilyData(active.familyId);
        }
      }
    } catch (err) {
      console.log("Backend not accessible, using offline mode");
    }
  }, [loadFamilyData]);

  const switchFamily = useCallback(async (familyStatus: MemberStatus) => {
    setCurrentFamily(familyStatus);
    await loadFamilyData(familyStatus.familyId);
  }, [loadFamilyData]);

  const loadMessages = useCallback(async (chatRoomId: number) => {
    try {
      const msgs = await chatService.getMessages(chatRoomId);
      setMessages(msgs);
    } catch (err) {
      console.error("Failed to load messages", err);
      setMessages([]);
    }
  }, []);

  const loadMedia = useCallback(async (familyId: number, type?: 'ALL' | 'IMAGE' | 'VIDEO' | 'FILE') => {
    try {
      const mediaType = type === 'ALL' ? undefined : type;
      const media = await mediaService.getRecentMedia(familyId, mediaType);
      setMediaList(media);
    } catch (err) {
      console.error("Error loading media", err);
      setMediaList([]);
    }
  }, []);

  const createFusionRequest = useCallback(async (data: {
    targetFamilyId: number;
    sourcePersonId: number;
    targetPersonId: number;
    relationshipType: 'PARENTAL' | 'UNION' | 'SIBLING';
    justification?: string;
  }) => {
    if (!currentFamily) return false;
    
    try {
      await multiFamilyService.requestFamilyFusion({
        sourceFamilyId: currentFamily.familyId,
        targetFamilyId: data.targetFamilyId,
        sourcePersonId: data.sourcePersonId,
        targetPersonId: data.targetPersonId,
        relationshipType: data.relationshipType,
        justification: data.justification
      });
      return true;
    } catch (err) {
      console.error("Error creating fusion request:", err);
      return false;
    }
  }, [currentFamily]);

  const validateFusionRequest = useCallback(async (requestId: number, action: 'APPROVE' | 'REJECT'): Promise<boolean> => {
    try {
      const result = await multiFamilyService.validateFusionRequest({ requestId, action });
      
      if (result.success && action === 'APPROVE' && currentFamily) {
        await loadFamilyData(currentFamily.familyId);
      }
      
      setPendingFusionRequests(prev => prev.filter(req => req.id !== requestId));
      return result.success ?? false;
    } catch (err) {
      console.error("Error validating fusion request:", err);
      return false;
    }
  }, [currentFamily, loadFamilyData]);

  return {
    // State
    userFamilies,
    currentFamily,
    treeData,
    chatRooms,
    messages,
    mediaList,
    familyEvents,
    pendingFusionRequests,
    isLoading,
    
    // Actions
    initializeFamilies,
    switchFamily,
    loadMessages,
    loadMedia,
    createFusionRequest,
    validateFusionRequest,
    
    // Setters (pour les composants enfants)
    setMessages,
    setChatRooms,
    setFamilyEvents,
    setMediaList,
    setTreeData
  };
};