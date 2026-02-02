import React, { memo } from 'react';
import { 
  Calendar, 
  MapPin, 
  PlusCircle, 
  Image, 
  X, 
  Edit, 
  Trash2, 
  Globe, 
  Lock, 
  Users, 
  UserCheck,
  Download,
  FileText
} from 'lucide-react';
import { type FamilyEvent, type CreateEventRequest } from '../../services/event.service';
import { type MemberStatus } from '../../services/member.service';
import { type Person } from '../../services/tree.service';

interface EventsInterfaceProps {
  // Data
  familyEvents: FamilyEvent[];
  currentFamily: MemberStatus | null;
  treeData: { persons: Person[] } | null;
  
  // Modal states
  showCreateEventModal: boolean;
  showEventDetailsModal: boolean;
  selectedEvent: any;
  newEvent: CreateEventRequest;
  
  // Actions
  setShowCreateEventModal: (show: boolean) => void;
  setShowEventDetailsModal: (show: boolean) => void;
  setNewEvent: (event: CreateEventRequest) => void;
  
  onCreateEvent: (e: React.FormEvent) => void;
  onViewEventDetails: (event: FamilyEvent) => void;
  onDeleteEvent: (eventId: number) => void;
  onUploadEventMedia: (eventId: number, files: FileList) => void;
  onOpenMediaViewer: (media: any, mediaList: any[], index: number) => void;
  getMediaUrl: (urlPath: string) => string;
}

export const EventsInterface = memo(({
  // Data
  familyEvents,
  currentFamily,
  treeData,
  
  // Modal states
  showCreateEventModal,
  showEventDetailsModal,
  selectedEvent,
  newEvent,
  
  // Actions
  setShowCreateEventModal,
  setShowEventDetailsModal,
  setNewEvent,
  
  onCreateEvent,
  onViewEventDetails,
  onDeleteEvent,
  onUploadEventMedia,
  onOpenMediaViewer,
  getMediaUrl
}: EventsInterfaceProps) => {
  return (
    <div className="events-interface">
      {/* Create Event Modal */}
      {showCreateEventModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setShowCreateEventModal(false)}>
              <X size={24}/>
            </button>
            <h2>Créer un événement</h2>
            <form onSubmit={onCreateEvent} className="event-form">
              <div className="form-group">
                <label>Titre de l'événement</label>
                <input 
                  type="text" 
                  required 
                  value={newEvent.title} 
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})} 
                  placeholder="Ex: Réunion de famille, Anniversaire..."
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date (optionnel)</label>
                  <input 
                    type="date" 
                    value={newEvent.eventDate} 
                    onChange={(e) => setNewEvent({...newEvent, eventDate: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label>Lieu (optionnel)</label>
                  <input 
                    type="text" 
                    value={newEvent.location} 
                    onChange={(e) => setNewEvent({...newEvent, location: e.target.value})} 
                    placeholder="Ex: Marseille, Chez Mamie..."
                  />
                </div>
              </div>
              
              {/* Visibility Selection */}
              <div className="form-group">
                <label>Visibilité de l'événement</label>
                <select 
                  value={newEvent.visibility} 
                  onChange={(e) => setNewEvent({...newEvent, visibility: e.target.value as 'PUBLIC' | 'PRIVATE' | 'RESTRICTED' | 'BRANCH'})}
                >
                  <option value="PUBLIC">Public - Visible par toute la famille</option>
                  <option value="PRIVATE">Privé - Visible seulement par moi</option>
                  <option value="RESTRICTED">Restreint - Visible par des personnes sélectionnées</option>
                  <option value="BRANCH">Lignée - Visible par la lignée d'une personne</option>
                </select>
              </div>

              {/* Target Person Selection for BRANCH events */}
              {newEvent.visibility === 'BRANCH' && treeData?.persons && treeData.persons.length > 0 && (
                <div className="form-group">
                  <label>Personne dont la lignée pourra voir cet événement</label>
                  <select 
                    value={newEvent.targetPersonId || ''} 
                    onChange={(e) => setNewEvent({...newEvent, targetPersonId: e.target.value ? Number(e.target.value) : undefined})}
                    required
                  >
                    <option value="">Sélectionner une personne...</option>
                    {treeData.persons.map((person: Person) => (
                      <option key={person.id} value={person.id}>
                        {person.firstName} {person.lastName}
                      </option>
                    ))}
                  </select>
                  <small style={{color: '#666', fontSize: '0.85rem', marginTop: '5px', display: 'block'}}>
                    Seuls les descendants et ascendants de cette personne pourront voir l'événement
                  </small>
                </div>
              )}

              {/* Guest Person Selection for RESTRICTED events */}
              {newEvent.visibility === 'RESTRICTED' && treeData?.persons && treeData.persons.length > 0 && (
                <div className="form-group">
                  <label>Personnes autorisées à voir cet événement</label>
                  <div className="guest-selection" style={{
                    maxHeight: '150px',
                    overflowY: 'auto',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '10px',
                    background: '#f9f9f9'
                  }}>
                    {treeData.persons.map((person: Person) => (
                      <label key={person.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '5px 0',
                        cursor: 'pointer'
                      }}>
                        <input 
                          type="checkbox"
                          checked={newEvent.guestPersonIds?.includes(person.id) || false}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            const currentGuests = newEvent.guestPersonIds || [];
                            
                            if (isChecked) {
                              setNewEvent({
                                ...newEvent,
                                guestPersonIds: [...currentGuests, person.id]
                              });
                            } else {
                              setNewEvent({
                                ...newEvent,
                                guestPersonIds: currentGuests.filter(id => id !== person.id)
                              });
                            }
                          }}
                        />
                        <span>{person.firstName} {person.lastName}</span>
                      </label>
                    ))}
                  </div>
                  {(!newEvent.guestPersonIds || newEvent.guestPersonIds.length === 0) && (
                    <small style={{color: '#666', fontSize: '0.85rem', marginTop: '5px', display: 'block'}}>
                      Sélectionnez au moins une personne pour un événement restreint
                    </small>
                  )}
                </div>
              )}

              <button type="submit" className="primary-btn" style={{width: '100%', marginTop: '1rem'}}>
                <Calendar size={20} style={{marginRight: 8}} />
                Créer l'événement
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {showEventDetailsModal && selectedEvent && (
        <div className="modal-overlay">
          <div className="modal-content event-details-modal">
            <button className="close-btn" onClick={() => setShowEventDetailsModal(false)}>
              <X size={24}/>
            </button>
            
            <div className="event-header">
              <div className="event-icon">
                <Calendar size={48} color="#326C58" />
              </div>
              <div className="event-info">
                <h2>{selectedEvent.title}</h2>
                {selectedEvent.eventDate && (
                  <div className="event-date">
                    <Calendar size={16} />
                    <span>{new Date(selectedEvent.eventDate).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  </div>
                )}
                {selectedEvent.location && (
                  <div className="event-location">
                    <MapPin size={16} />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                
                {/* Visibility and Creator Info */}
                <div className="event-meta" style={{
                  display: 'flex',
                  gap: '15px',
                  marginTop: '10px',
                  fontSize: '0.9rem',
                  color: '#666'
                }}>
                  <div className="event-visibility" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    background: selectedEvent.visibility === 'PUBLIC' ? '#e8f5e8' : 
                               selectedEvent.visibility === 'PRIVATE' ? '#fff3cd' : 
                               selectedEvent.visibility === 'BRANCH' ? '#e1f5fe' : '#f8d7da',
                    color: selectedEvent.visibility === 'PUBLIC' ? '#155724' : 
                           selectedEvent.visibility === 'PRIVATE' ? '#856404' : 
                           selectedEvent.visibility === 'BRANCH' ? '#01579b' : '#721c24'
                  }}>
                    {selectedEvent.visibility === 'PUBLIC' ? (
                      <>
                        <Globe size={14} />
                        <span>Public</span>
                      </>
                    ) : selectedEvent.visibility === 'PRIVATE' ? (
                      <>
                        <Lock size={14} />
                        <span>Privé</span>
                      </>
                    ) : selectedEvent.visibility === 'BRANCH' ? (
                      <>
                        <Users size={14} />
                        <span>Lignée</span>
                      </>
                    ) : (
                      <>
                        <UserCheck size={14} />
                        <span>Restreint</span>
                      </>
                    )}
                  </div>
                  
                  {selectedEvent.creator && (
                    <div className="event-creator" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <span>Créé par {selectedEvent.creator.displayName}</span>
                    </div>
                  )}
                </div>

                {/* Target Person for BRANCH events */}
                {selectedEvent.visibility === 'BRANCH' && selectedEvent.targetPersonId && (
                  <div className="event-target-person" style={{
                    marginTop: '10px',
                    padding: '10px',
                    background: '#e1f5fe',
                    borderRadius: '8px',
                    border: '1px solid #b3e5fc'
                  }}>
                    <div style={{
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: '#01579b',
                      marginBottom: '5px'
                    }}>
                      Lignée de :
                    </div>
                    <div style={{
                      fontSize: '0.9rem',
                      color: '#0277bd'
                    }}>
                      {(() => {
                        const targetPerson = treeData?.persons.find((p: Person) => p.id === selectedEvent.targetPersonId);
                        return targetPerson ? `${targetPerson.firstName} ${targetPerson.lastName}` : `Personne #${selectedEvent.targetPersonId}`;
                      })()}
                    </div>
                    <small style={{
                      fontSize: '0.75rem',
                      color: '#0288d1',
                      fontStyle: 'italic'
                    }}>
                      Visible par tous les descendants et ascendants de cette personne
                    </small>
                  </div>
                )}

                {/* Guest List for RESTRICTED events */}
                {selectedEvent.visibility === 'RESTRICTED' && selectedEvent.guestPersonIds && selectedEvent.guestPersonIds.length > 0 && (
                  <div className="event-guests" style={{
                    marginTop: '10px',
                    padding: '10px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: '#495057',
                      marginBottom: '5px'
                    }}>
                      Personnes autorisées :
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#6c757d'
                    }}>
                      {selectedEvent.guestPersonIds.map((personId: number) => {
                        const person = treeData?.persons.find((p: Person) => p.id === personId);
                        return person ? `${person.firstName} ${person.lastName}` : `Personne #${personId}`;
                      }).join(', ')}
                    </div>
                  </div>
                )}
              </div>
              <div className="event-actions">
                <button 
                  className="icon-btn edit-btn" 
                  title="Modifier"
                  onClick={() => {
                    alert("Modification à implémenter");
                  }}
                >
                  <Edit size={20} />
                </button>
                <button 
                  className="icon-btn delete-btn" 
                  title="Supprimer"
                  onClick={() => onDeleteEvent(selectedEvent.id)}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            <div className="event-media">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>Photos et vidéos ({selectedEvent._count?.media || 0})</h3>
                <button
                  className="primary-btn"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*,video/*';
                    input.multiple = true;
                    input.onchange = async (e) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (files && currentFamily) {
                        onUploadEventMedia(selectedEvent.id, files);
                      }
                    };
                    input.click();
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #326C58 0%, #4A9B7F 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <PlusCircle size={16} />
                  Ajouter des médias
                </button>
              </div>
              {selectedEvent.media && selectedEvent.media.length > 0 ? (
                <div className="media-grid">
                  {selectedEvent.media.map((media: any, index: number) => (
                    <div key={media.id} className="media-item">
                      {media.mediaType === 'IMAGE' ? (
                        <img 
                          src={getMediaUrl(media.urlPath)} 
                          alt="Event media" 
                          onClick={() => onOpenMediaViewer(media, selectedEvent.media, index)}
                          className="clickable-media"
                        />
                      ) : media.mediaType === 'VIDEO' ? (
                        <div className="video-thumbnail" onClick={() => onOpenMediaViewer(media, selectedEvent.media, index)}>
                          <video 
                            src={getMediaUrl(media.urlPath)} 
                            style={{width: '100%', height: '100%', objectFit: 'cover'}}
                          />
                          <div className="video-overlay">
                            <div className="play-button">▶</div>
                          </div>
                        </div>
                      ) : (
                        <div className="file-item">
                          <FileText size={32} color="#666" />
                          <span className="file-name">Fichier</span>
                          <a 
                            href={getMediaUrl(media.urlPath)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="file-download-btn"
                          >
                            <Download size={16} />
                            Télécharger
                          </a>
                        </div>
                      )}
                      <div className="media-uploader">
                        Par {media.uploader.displayName}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-media">Aucun média pour cet événement</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Events Header */}
      <div className="events-header">
        <div className="events-title">
          <Calendar size={32} color="#326C58" />
          <div>
            <h2>Événements familiaux</h2>
            <p>Organisez et partagez vos moments importants</p>
          </div>
        </div>
        <button 
          className="primary-btn"
          onClick={() => setShowCreateEventModal(true)}
          style={{
            background: 'linear-gradient(135deg, #326C58 0%, #4A9B7F 100%)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(50, 108, 88, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <PlusCircle size={20} />
          Nouvel événement
        </button>
      </div>

      {/* Events Grid */}
      <div className="events-grid">
        {familyEvents.length > 0 ? familyEvents.map(event => (
          <div 
            key={event.id} 
            className="event-card"
            onClick={() => onViewEventDetails(event)}
          >
            <div className="event-card-header">
              <div className="event-icon">
                <Calendar size={24} color="#326C58" />
              </div>
              <div className="event-visibility-badge" style={{
                padding: '2px 6px',
                borderRadius: '8px',
                fontSize: '0.7rem',
                fontWeight: '600',
                background: event.visibility === 'PUBLIC' ? '#e8f5e8' : 
                           event.visibility === 'PRIVATE' ? '#fff3cd' : 
                           event.visibility === 'BRANCH' ? '#e1f5fe' : '#f8d7da',
                color: event.visibility === 'PUBLIC' ? '#155724' : 
                       event.visibility === 'PRIVATE' ? '#856404' : 
                       event.visibility === 'BRANCH' ? '#01579b' : '#721c24'
              }}>
                {event.visibility === 'PUBLIC' ? 'PUBLIC' : 
                 event.visibility === 'PRIVATE' ? 'PRIVÉ' : 
                 event.visibility === 'BRANCH' ? 'LIGNÉE' : 'RESTREINT'}
              </div>
              <div className="event-media-count">
                {event._count?.media || 0} <Image size={16} />
              </div>
            </div>
            
            <div className="event-card-content">
              <h3>{event.title}</h3>
              
              {event.eventDate && (
                <div className="event-date">
                  <Calendar size={14} />
                  <span>{new Date(event.eventDate).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}</span>
                </div>
              )}
              
              {event.location && (
                <div className="event-location">
                  <MapPin size={14} />
                  <span>{event.location}</span>
                </div>
              )}
            </div>
            
            <div className="event-card-footer">
              <span className="event-created">
                Créé le {new Date(event.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
        )) : (
          <div className="empty-events">
            <Calendar size={64} color="#ccc" />
            <h3>Aucun événement</h3>
            <p>Créez votre premier événement familial pour commencer à organiser vos moments importants.</p>
            <button 
              className="primary-btn"
              onClick={() => setShowCreateEventModal(true)}
              style={{
                background: 'linear-gradient(135deg, #326C58 0%, #4A9B7F 100%)',
                color: 'white',
                border: 'none',
                padding: '15px 30px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginTop: '20px'
              }}
            >
              <PlusCircle size={20} />
              Créer mon premier événement
            </button>
          </div>
        )}
      </div>
    </div>
  );
});