import { useState, useCallback } from 'react';
import { eventService, type FamilyEvent, type CreateEventRequest } from '../services/event.service';
import { type MemberStatus } from '../services/member.service';
import { type useToast } from './useToast';

export const useEvents = (
  currentFamily: MemberStatus | null,
  onEventsUpdate: (events: FamilyEvent[]) => void,
  toast: ReturnType<typeof useToast>
) => {
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [newEvent, setNewEvent] = useState<CreateEventRequest>({
    familyIds: [],
    title: '',
    eventDate: '',
    location: '',
    visibility: 'PUBLIC',
    guestPersonIds: [],
    targetPersonId: undefined
  });

  const handleCreateEvent = useCallback(async (e: React.FormEvent, familyEvents: FamilyEvent[]) => {
    e.preventDefault();
    if (!currentFamily || !newEvent.title.trim()) return;

    if (newEvent.visibility === 'RESTRICTED' && (!newEvent.guestPersonIds || newEvent.guestPersonIds.length === 0)) {
      toast.warning("Veuillez sélectionner au moins une personne pour un événement restreint");
      return;
    }

    if (newEvent.visibility === 'BRANCH' && !newEvent.targetPersonId) {
      toast.warning("Veuillez sélectionner une personne pour définir la lignée");
      return;
    }

    try {
      const eventData = {
        ...newEvent,
        familyIds: [currentFamily.familyId]
      };
      
      const createdEvent = await eventService.createEvent(eventData);
      onEventsUpdate([...familyEvents, createdEvent]);
      setShowCreateEventModal(false);
      setNewEvent({
        familyIds: [],
        title: '',
        eventDate: '',
        location: '',
        visibility: 'PUBLIC',
        guestPersonIds: [],
        targetPersonId: undefined
      });
      toast.success("Événement créé avec succès !");
    } catch (err: any) {
      console.error("Error creating event", err);
      const errorMessage = err.userMessage || 
        err.response?.data?.message || 
        "Erreur lors de la création de l'événement";
      toast.error(errorMessage);
    }
  }, [currentFamily, newEvent, onEventsUpdate, toast]);

  const handleViewEventDetails = useCallback(async (event: FamilyEvent) => {
    try {
      const eventDetails = await eventService.getEventDetails(event.id);
      setSelectedEvent(eventDetails);
      setShowEventDetailsModal(true);
    } catch (err: any) {
      console.error("Error loading event details", err);
      const errorMessage = err.userMessage || 
        err.response?.data?.message || 
        "Erreur lors du chargement des détails";
      toast.error(errorMessage);
    }
  }, [toast]);

  const handleDeleteEvent = useCallback(async (eventId: number, familyEvents: FamilyEvent[]) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) return;
    
    try {
      await eventService.deleteEvent(eventId);
      onEventsUpdate(familyEvents.filter(e => e.id !== eventId));
      setShowEventDetailsModal(false);
      toast.success("Événement supprimé !");
    } catch (err: any) {
      console.error("Error deleting event", err);
      const errorMessage = err.userMessage || 
        err.response?.data?.message || 
        "Erreur lors de la suppression";
      toast.error(errorMessage);
    }
  }, [onEventsUpdate, toast]);

  return {
    // State
    showCreateEventModal,
    showEventDetailsModal,
    selectedEvent,
    newEvent,
    
    // Setters
    setShowCreateEventModal,
    setShowEventDetailsModal,
    setSelectedEvent,
    setNewEvent,
    
    // Actions
    handleCreateEvent,
    handleViewEventDetails,
    handleDeleteEvent
  };
};