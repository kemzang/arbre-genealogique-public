import { useState, useCallback } from 'react';
import { eventService, type FamilyEvent, type CreateEventRequest } from '../services/event.service';
import { type MemberStatus } from '../services/member.service';

export const useEvents = (
  currentFamily: MemberStatus | null,
  onEventsUpdate: (events: FamilyEvent[]) => void
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
      alert("Veuillez sélectionner au moins une personne pour un événement restreint");
      return;
    }

    if (newEvent.visibility === 'BRANCH' && !newEvent.targetPersonId) {
      alert("Veuillez sélectionner une personne pour définir la lignée");
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
      alert("Événement créé avec succès !");
    } catch (err) {
      console.error("Error creating event", err);
      alert("Erreur lors de la création de l'événement");
    }
  }, [currentFamily, newEvent, onEventsUpdate]);

  const handleViewEventDetails = useCallback(async (event: FamilyEvent) => {
    try {
      const eventDetails = await eventService.getEventDetails(event.id);
      setSelectedEvent(eventDetails);
      setShowEventDetailsModal(true);
    } catch (err) {
      console.error("Error loading event details", err);
      alert("Erreur lors du chargement des détails");
    }
  }, []);

  const handleDeleteEvent = useCallback(async (eventId: number, familyEvents: FamilyEvent[]) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) return;
    
    try {
      await eventService.deleteEvent(eventId);
      onEventsUpdate(familyEvents.filter(e => e.id !== eventId));
      setShowEventDetailsModal(false);
      alert("Événement supprimé !");
    } catch (err) {
      console.error("Error deleting event", err);
      alert("Erreur lors de la suppression");
    }
  }, [onEventsUpdate]);

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