import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  MessageCircle, 
  Calendar, 
  ArrowRight, 
  LogOut,
  Shield
} from 'lucide-react';
import './dashboard.scss';

// Hooks
import { useFamilyData } from '../../hooks/useFamilyData';
import { useChat } from '../../hooks/useChat';
import { useTreeManagement } from '../../hooks/useTreeManagement';
import { useEvents } from '../../hooks/useEvents';
import { useMediaViewer } from '../../hooks/useMediaViewer';

// Components
import { FamilySelector } from '../../components/dashboard/FamilySelector';
import { TreeVisualization } from '../../components/dashboard/TreeVisualization';
import { ChatInterface } from '../../components/dashboard/ChatInterface';
import { EventsInterface } from '../../components/dashboard/EventsInterface';
import { FusionInterface } from '../../components/dashboard/FusionInterface';
import { PendingMembersPanel } from '../../components/dashboard/PendingMembersPanel';
import { MediaViewer } from '../../components/dashboard/MediaViewer';
import { AddPersonModal } from '../../components/dashboard/AddPersonModal';
import { PersonDetailModal } from '../../components/dashboard/PersonDetailModal';
import { RelationshipDetailModal } from '../../components/dashboard/RelationshipDetailModal';

// Services
import { authService, type User } from '../../services/auth.service';
import { familyService } from '../../services/family.service';
import { treeService } from '../../services/tree.service';
import { mediaService } from '../../services/media.service';
import { eventService } from '../../services/event.service';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'TREE' | 'CHAT' | 'EVENTS' | 'FUSION'>('TREE');
  
  // Family selector state
  const [showFamilySelector, setShowFamilySelector] = useState(false);
  
  // Logout State
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Create family modal
  const [showCreateFamilyModal, setShowCreateFamilyModal] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [createFamilyError, setCreateFamilyError] = useState<string | null>(null);
  const [isCreatingFamily, setIsCreatingFamily] = useState(false);

  // Join family modal
  const [showJoinFamilyModal, setShowJoinFamilyModal] = useState(false);
  const [familySearchQuery, setFamilySearchQuery] = useState('');
  const [isSearchingFamilies, setIsSearchingFamilies] = useState(false);
  const [familySearchResults, setFamilySearchResults] = useState<Array<{ id: number; familyName: string }>>([]);
  const [selectedJoinFamilyId, setSelectedJoinFamilyId] = useState<number | null>(null);
  const [joinGender, setJoinGender] = useState<'M' | 'F' | 'O'>('M');
  const [joinRelationshipType, setJoinRelationshipType] = useState<'PARENTAL' | 'UNION' | 'SIBLING'>('PARENTAL');
  const [joinRelatedPersonId, setJoinRelatedPersonId] = useState<string>('');
  const [isSubmittingJoin, setIsSubmittingJoin] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  
  // Media filter
  const [mediaFilter, setMediaFilter] = useState<'ALL' | 'IMAGE' | 'VIDEO' | 'FILE'>('ALL');

  // Person and Relationship detail modals
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<number | null>(null);

  // Custom hooks
  const familyData = useFamilyData();
  const mediaViewer = useMediaViewer();
  const treeManagement = useTreeManagement(
    familyData.currentFamily, 
    familyData.treeData, 
    (tree) => familyData.setTreeData?.(tree)
  );
  const events = useEvents(familyData.currentFamily, familyData.setFamilyEvents);
  const chat = useChat(
    familyData.currentFamily,
    user,
    familyData.setMessages,
    familyData.setChatRooms,
    () => familyData.loadMedia(familyData.currentFamily?.familyId || 0, mediaFilter)
  );

  // Initialize user and families
  useEffect(() => {
    // Validate and fix user data if needed
    const u = authService.validateAndFixUserData();
    if (!u) {
      navigate('/');
      return;
    }
    
    console.log('DashboardPage - Validated user:', u);
    setUser(u);
    familyData.initializeFamilies();
  }, [navigate]);

  // Refetch media when filter changes
  useEffect(() => {
    if (familyData.currentFamily) {
      familyData.loadMedia(familyData.currentFamily.familyId, mediaFilter);
    }
  }, [mediaFilter]);

  const openCreateFamilyModal = () => {
    setNewFamilyName('');
    setCreateFamilyError(null);
    setShowCreateFamilyModal(true);
  };

  const openJoinFamilyModal = () => {
    setFamilySearchQuery('');
    setFamilySearchResults([]);
    setSelectedJoinFamilyId(null);
    setJoinGender('M');
    setJoinRelationshipType('PARENTAL');
    setJoinRelatedPersonId('');
    setJoinError(null);
    setShowJoinFamilyModal(true);
  };

  const closeJoinFamilyModal = () => {
    if (!isSubmittingJoin && !isSearchingFamilies) {
      setShowJoinFamilyModal(false);
    }
  };

  const handleSearchFamilies = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familySearchQuery.trim()) return;
    setIsSearchingFamilies(true);
    setJoinError(null);
    try {
      const results = await familyService.searchFamilies(familySearchQuery.trim());
      setFamilySearchResults(results);
    } catch (err) {
      console.error('Erreur recherche famille:', err);
      setJoinError("Impossible de rechercher des familles. Vérifiez votre connexion.");
    } finally {
      setIsSearchingFamilies(false);
    }
  };

  const handleSubmitJoinFamily = async () => {
    if (!selectedJoinFamilyId) {
      setJoinError('Veuillez sélectionner une famille.');
      return;
    }
    setIsSubmittingJoin(true);
    setJoinError(null);
    try {
      await familyService.joinFamily({
        familyId: selectedJoinFamilyId,
        gender: joinGender,
        relatedToPersonId: joinRelatedPersonId ? Number(joinRelatedPersonId) : undefined,
        relationshipType: joinRelationshipType
      });
      setShowJoinFamilyModal(false);
      alert('Votre demande pour rejoindre cette famille a été envoyée. Les administrateurs doivent la valider.');
    } catch (err) {
      console.error('Erreur demande de rejoindre une famille:', err);
      setJoinError("Impossible d'envoyer la demande. Vérifiez votre connexion ou si une demande existe déjà.");
    } finally {
      setIsSubmittingJoin(false);
    }
  };

  const closeCreateFamilyModal = () => {
    if (!isCreatingFamily) {
      setShowCreateFamilyModal(false);
      setNewFamilyName('');
      setCreateFamilyError(null);
    }
  };

  const handleSubmitCreateFamily = async () => {
    const name = newFamilyName.trim();
    if (!name) {
      setCreateFamilyError('Veuillez entrer un nom pour votre famille.');
      return;
    }
    setCreateFamilyError(null);
    setIsCreatingFamily(true);
    try {
      await familyService.createFamily(name);
      await familyData.initializeFamilies();
      setShowCreateFamilyModal(false);
      setNewFamilyName('');
    } catch (e) {
      console.error('Erreur création famille:', e);
      setCreateFamilyError('Impossible de créer la famille. Vérifiez votre connexion ou réessayez.');
    } finally {
      setIsCreatingFamily(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    authService.logout();
    navigate('/');
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  // Utility function for media URLs
  const getMediaUrl = (urlPath: string): string => {
    if (!urlPath) return '';
    
    if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) {
      return urlPath;
    }
    
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const baseUrl = backendUrl.replace('/api', '');
    const cleanPath = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
    
    return `${baseUrl}${cleanPath}`;
  };

  if (familyData.isLoading) {
    return (
      <div className="loader-page">
        <span className="loader"></span> 
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Media Viewer Modal */}
      <MediaViewer
        showMediaViewer={mediaViewer.showMediaViewer}
        selectedMedia={mediaViewer.selectedMedia}
        mediaViewerIndex={mediaViewer.mediaViewerIndex}
        mediaViewerList={mediaViewer.mediaViewerList}
        onClose={mediaViewer.closeMediaViewer}
        onNavigate={mediaViewer.navigateMedia}
        getMediaUrl={getMediaUrl}
      />

      {/* Header */}
      <header>
        <FamilySelector
          currentFamily={familyData.currentFamily}
          userFamilies={familyData.userFamilies}
          showFamilySelector={showFamilySelector}
          setShowFamilySelector={setShowFamilySelector}
          onFamilySwitch={familyData.switchFamily}
        />
        
        <div className="user-controls">
          {familyData.currentFamily && (
            <>
              <button className={`btn-nav ${activeTab === 'TREE' ? 'active' : ''}`} onClick={() => setActiveTab('TREE')}>
                <Users size={16} style={{marginRight: 8, verticalAlign: 'middle'}}/> Arbre
              </button>
              <button className={`btn-nav ${activeTab === 'CHAT' ? 'active' : ''}`} onClick={() => setActiveTab('CHAT')}>
                <MessageCircle size={16} style={{marginRight: 8, verticalAlign: 'middle'}}/> Chat & Médias
              </button>
              <button className={`btn-nav ${activeTab === 'EVENTS' ? 'active' : ''}`} onClick={() => setActiveTab('EVENTS')}>
                <Calendar size={16} style={{marginRight: 8, verticalAlign: 'middle'}}/> Événements
              </button>
              {familyData.currentFamily.role === 'ADMIN' && (
                <button className={`btn-nav ${activeTab === 'FUSION' ? 'active' : ''}`} onClick={() => setActiveTab('FUSION')}>
                  <ArrowRight size={16} style={{marginRight: 8, verticalAlign: 'middle'}}/> Fusion
                </button>
              )}
            </>
          )}
          {authService.isSuperAdmin(user) && (
            <button 
              className="btn-nav admin-btn" 
              onClick={() => navigate('/admin')} 
              title="Panneau d'Administration"
            >
              <Shield size={16} style={{marginRight: 8, verticalAlign: 'middle'}}/> Admin
            </button>
          )}
          <div className="profile">
            <div className="avatar">
              {user?.displayName?.[0].toUpperCase() || 'U'}
            </div>
            <div className="info">
              <span className="name">{user?.displayName || 'Utilisateur'}</span>
              <span className="role">{familyData.currentFamily?.role || 'Visiteur'}</span>
            </div>
          </div>
          <button className="btn-nav icon-only" onClick={handleLogout} title="Déconnexion">
            <LogOut size={16}/>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {!familyData.currentFamily ? (
          <div className="empty-state">
            <Users size={64} color="#326C58" />
            <h2>Bienvenue, {user?.displayName} !</h2>
            <p>Vous ne faites partie d'aucune famille pour l'instant.</p>
            <div className="actions">
              <button onClick={openCreateFamilyModal}>Créer ma famille</button>
              <button 
                className="ghost" 
                style={{color: '#326C58', borderColor: '#326C58'}} 
                onClick={openJoinFamilyModal}
              >
                Rejoindre une famille
              </button>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'TREE' && (
              <>
                {familyData.pendingMembers.length > 0 && (
                  <PendingMembersPanel
                    currentFamily={familyData.currentFamily}
                    pendingMembers={familyData.pendingMembers}
                    onValidate={familyData.validatePendingMember}
                  />
                )}
                <div className="tree-visualizer">
                  <TreeVisualization
                    treeData={familyData.treeData}
                    treeZoom={treeManagement.treeZoom}
                    setTreeZoom={treeManagement.setTreeZoom}
                    onAddPerson={treeManagement.openAddPersonModal}
                    onViewPerson={(personId) => setSelectedPersonId(personId)}
                    onViewRelationship={(relationshipId) => setSelectedRelationshipId(relationshipId)}
                  />
                </div>
              </>
            )}
            
            {activeTab === 'CHAT' && (
              <ChatInterface
                // Data
                chatRooms={familyData.chatRooms}
                messages={familyData.messages}
                mediaList={familyData.mediaList}
                user={user}
                treeData={familyData.treeData}
                
                // Chat state
                activeRoomId={chat.activeRoomId}
                newMessage={chat.newMessage}
                pendingFiles={chat.pendingFiles}
                uploadProgress={chat.uploadProgress}
                isUploading={chat.isUploading}
                mediaFilter={mediaFilter}
                
                // Modal states
                showCreateRoomModal={chat.showCreateRoomModal}
                showRoomSettingsModal={chat.showRoomSettingsModal}
                roomFormData={chat.roomFormData}
                editingRoom={chat.editingRoom}
                participantToAdd={chat.participantToAdd}
                createRoomAvatarFile={chat.createRoomAvatarFile}
                editRoomAvatarFile={chat.editRoomAvatarFile}
                
                // Actions
                setActiveRoomId={chat.setActiveRoomId}
                setNewMessage={chat.setNewMessage}
                setPendingFiles={chat.setPendingFiles}
                setMediaFilter={setMediaFilter}
                setShowCreateRoomModal={chat.setShowCreateRoomModal}
                setShowRoomSettingsModal={chat.setShowRoomSettingsModal}
                setRoomFormData={chat.setRoomFormData}
                setEditingRoom={chat.setEditingRoom}
                setParticipantToAdd={chat.setParticipantToAdd}
                setCreateRoomAvatarFile={chat.setCreateRoomAvatarFile}
                setEditRoomAvatarFile={chat.setEditRoomAvatarFile}
                
                onFileSelect={chat.handleFileSelect}
                onSendMessage={(e) => chat.handleSendMessage(e, familyData.messages)}
                onCreateRoom={() => chat.handleCreateRoom(familyData.chatRooms)}
                onUpdateRoom={() => chat.handleUpdateRoom(familyData.chatRooms)}
                onLoadMessages={familyData.loadMessages}
                onOpenMediaViewer={mediaViewer.openMediaViewer}
                getMediaUrl={getMediaUrl}
              />
            )}
            
            {activeTab === 'EVENTS' && (
              <EventsInterface
                // Data
                familyEvents={familyData.familyEvents}
                currentFamily={familyData.currentFamily}
                treeData={familyData.treeData}
                
                // Modal states
                showCreateEventModal={events.showCreateEventModal}
                showEventDetailsModal={events.showEventDetailsModal}
                selectedEvent={events.selectedEvent}
                newEvent={events.newEvent}
                
                // Actions
                setShowCreateEventModal={events.setShowCreateEventModal}
                setShowEventDetailsModal={events.setShowEventDetailsModal}
                setNewEvent={events.setNewEvent}
                
                onCreateEvent={(e) => events.handleCreateEvent(e, familyData.familyEvents)}
                onViewEventDetails={events.handleViewEventDetails}
                onDeleteEvent={(eventId) => events.handleDeleteEvent(eventId, familyData.familyEvents)}
                onUploadEventMedia={async (eventId, files) => {
                  if (!familyData.currentFamily) return;
                  try {
                    const fileArray = Array.from(files);
                    for (const file of fileArray) {
                      await mediaService.uploadFile(
                        file,
                        familyData.currentFamily.familyId,
                        undefined,
                        eventId
                      );
                    }
                    // Recharger les événements et les détails de l'événement courant
                    const updatedEvents = await eventService.getFamilyEvents(familyData.currentFamily.familyId);
                    familyData.setFamilyEvents(updatedEvents);
                    const updatedEvent = updatedEvents.find((e) => e.id === eventId);
                    if (updatedEvent) {
                      await events.handleViewEventDetails(updatedEvent);
                    }
                    alert('Médias ajoutés avec succès à cet événement.');
                  } catch (err) {
                    console.error('Erreur upload médias événement:', err);
                    alert("Erreur lors de l'ajout des médias. Vérifiez votre connexion.");
                  }
                }}
                onOpenMediaViewer={mediaViewer.openMediaViewer}
                getMediaUrl={getMediaUrl}
              />
            )}
            
            {activeTab === 'FUSION' && familyData.currentFamily?.role === 'ADMIN' && (
              <FusionInterface
                // Data
                currentFamily={familyData.currentFamily}
                treeData={familyData.treeData}
                pendingFusionRequests={familyData.pendingFusionRequests}
                
                // Actions
                onCreateFusionRequest={familyData.createFusionRequest}
                onValidateFusionRequest={familyData.validateFusionRequest}
                onSearchFamilies={familyService.searchFamilies}
              />
            )}
          </>
        )}
      </main>

      {/* Add Person Modal */}
      <AddPersonModal
        showAddPersonModal={treeManagement.showAddPersonModal}
        newPerson={treeManagement.newPerson}
        relatedPersonId={treeManagement.relatedPersonId}
        relationshipType={treeManagement.relationshipType}
        treeData={familyData.treeData}
        setShowAddPersonModal={treeManagement.setShowAddPersonModal}
        setNewPerson={treeManagement.setNewPerson}
        setRelatedPersonId={treeManagement.setRelatedPersonId}
        setRelationshipType={treeManagement.setRelationshipType}
        onAddPerson={treeManagement.handleAddPerson}
      />

      {/* Person Detail Modal */}
      {selectedPersonId && familyData.currentFamily && (
        <PersonDetailModal
          personId={selectedPersonId}
          familyId={familyData.currentFamily.familyId}
          onClose={() => setSelectedPersonId(null)}
          onUpdate={async () => {
            if (familyData.currentFamily) {
              const updatedTree = await treeService.getTree(familyData.currentFamily.familyId);
              familyData.setTreeData?.(updatedTree);
            }
          }}
          onViewRelationship={(relationshipId) => setSelectedRelationshipId(relationshipId)}
        />
      )}

      {/* Relationship Detail Modal */}
      {selectedRelationshipId && (
        <RelationshipDetailModal
          relationshipId={selectedRelationshipId}
          onClose={() => setSelectedRelationshipId(null)}
          onUpdate={async () => {
            if (familyData.currentFamily) {
              const updatedTree = await treeService.getTree(familyData.currentFamily.familyId);
              familyData.setTreeData?.(updatedTree);
            }
          }}
        />
      )}

      {/* Create Family Modal */}
      {showCreateFamilyModal && (
        <div className="modal-overlay" onClick={closeCreateFamilyModal}>
          <div className="modal-content logout-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h2>Créer ma famille</h2>
            <p style={{ marginBottom: 16 }}>Choisissez un nom pour votre famille.</p>
            <input
              type="text"
              placeholder="Nom de la famille"
              value={newFamilyName}
              onChange={(e) => setNewFamilyName(e.target.value)}
              disabled={isCreatingFamily}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitCreateFamily()}
              style={{
                width: '100%',
                padding: '10px 12px',
                marginBottom: 8,
                border: '1px solid #ddd',
                borderRadius: 8,
                fontSize: 16,
                boxSizing: 'border-box',
              }}
            />
            {createFamilyError && (
              <p style={{ color: '#c0392b', fontSize: 13, marginBottom: 12 }}>{createFamilyError}</p>
            )}
            <div className="logout-actions">
              <button className="cancel-btn" onClick={closeCreateFamilyModal} disabled={isCreatingFamily}>
                Annuler
              </button>
              <button
                className="confirm-btn"
                onClick={handleSubmitCreateFamily}
                disabled={isCreatingFamily}
                style={{ background: '#326C58' }}
              >
                {isCreatingFamily ? 'Création...' : 'Créer la famille'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal-content logout-modal">
            <div className="logout-icon">
              <LogOut size={48} color="#e74c3c" />
            </div>
            <h2>Confirmer la déconnexion</h2>
            <p>Êtes-vous sûr de vouloir vous déconnecter ?</p>
            <div className="logout-actions">
              <button className="cancel-btn" onClick={cancelLogout}>
                Annuler
              </button>
              <button className="confirm-btn" onClick={confirmLogout}>
                <LogOut size={16} />
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}