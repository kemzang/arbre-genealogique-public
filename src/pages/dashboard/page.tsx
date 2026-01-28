import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, PlusCircle, Flower, MessageCircle, Image, LogOut, Users, Search, X, Settings, Lock, Globe, Trash2, UserPlus, UserMinus } from 'lucide-react';
import './dashboard.scss';
import { authService, type User } from '../../services/auth.service';
import { familyService, type Family } from '../../services/family.service';
import { treeService, type TreeData } from '../../services/tree.service';
import { chatService, type Message, type ChatRoom, type CreateRoomRequest, type UpdateRoomRequest } from '../../services/chat.service';
import { memberService, type MemberStatus } from '../../services/member.service';
import { mediaService, type MediaItem } from '../../services/media.service';

/**
 * Construit l'URL complète d'un média
 * Si l'URL commence par http:// ou https://, on la retourne telle quelle
 * Sinon, on ajoute l'URL du backend
 */
const getMediaUrl = (urlPath: string): string => {
  if (!urlPath) return '';
  
  // Si c'est déjà une URL complète, on la retourne
  if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) {
    return urlPath;
  }
  
  // Sinon, on construit l'URL complète avec le backend
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const baseUrl = backendUrl.replace('/api', ''); // Enlever /api pour avoir juste l'URL de base
  
  // S'assurer qu'il n'y a pas de double slash
  const cleanPath = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
  
  return `${baseUrl}${cleanPath}`;
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [currentFamily, setCurrentFamily] = useState<MemberStatus | null>(null);
  const [activeTab, setActiveTab] = useState<'TREE' | 'CHAT'>('TREE');
  const [treeData, setTreeData] = useState<TreeData | null>(null);
  
  // Chat & Media State
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [mediaFilter, setMediaFilter] = useState<'ALL' | 'IMAGE' | 'VIDEO' | 'FILE'>('ALL');
  
  // Stockage des fichiers en attente (pas encore uploadés)
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Search / Join States
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Family[]>([]);
  const [joinGender, setJoinGender] = useState<'M'|'F'|'O'>('M');

  // Create/Edit Room State
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
  
  // Avatar Upload States
  const [createRoomAvatarFile, setCreateRoomAvatarFile] = useState<File | null>(null);
  const [editRoomAvatarFile, setEditRoomAvatarFile] = useState<File | null>(null);
  const createAvatarInputRef = React.useRef<HTMLInputElement>(null);
  const editAvatarInputRef = React.useRef<HTMLInputElement>(null);

  // Add Person State
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [newPerson, setNewPerson] = useState({
    firstName: '',
    lastName: '',
    gender: 'M',
    birthDate: ''
  });
  const [relatedPersonId, setRelatedPersonId] = useState<number | null>(null);
  const [relationshipType, setRelationshipType] = useState<'PARENT' | 'CHILD' | 'SPOUSE' | 'SIBLING'>('CHILD');

  // Load User & Family Status
  useEffect(() => {
    const u = authService.getCurrentUser();
    if (!u) {
      navigate('/');
      return;
    }
    setUser(u);

    console.log("Fetching member status...");
    memberService.getMemberStatus().then(statuses => {
      console.log("Member statuses:", statuses);
      if (!Array.isArray(statuses)) {
        console.error("Invalid statuses response:", statuses);
        setIsLoading(false);
        return;
      }
      const active = statuses.find(s => s.status === 'ACTIVE');
      if (active) {
        console.log("Active family found:", active);
        setCurrentFamily(active);
        loadFamilyData(active.familyId);
      } else {
        console.log("No active family found.");
        setIsLoading(false);
      }
    }).catch(err => {
      console.error("Error fetching member status:", err);
      setIsLoading(false);
    });
  }, [navigate]);

  // Refetch media when filter changes (only if family loaded)
  useEffect(() => {
    if (currentFamily) {
        loadMedia(currentFamily.familyId);
    }
  }, [mediaFilter]);

  const loadMedia = async (familyId: number) => {
      try {
          const type = mediaFilter === 'ALL' ? undefined : mediaFilter;
          const media = await mediaService.getRecentMedia(familyId, type);
          setMediaList(media);
      } catch (err) {
          console.error("Error loading media", err);
      }
  };

  const loadMessages = async (chatRoomId: number) => {
    try {
        const msgs = await chatService.getMessages(chatRoomId);
        setMessages(msgs);
    } catch (err) {
        console.error("Failed to load messages", err);
    }
  };

  const loadFamilyData = async (familyId: number) => {
    try {
      setIsLoading(true);
      // Fetch Tree
      const tree = await treeService.getTree(familyId);
      setTreeData(tree);
      
      // Fetch Chat Rooms
      try {
        const rooms = await chatService.getChatRooms(familyId);
        setChatRooms(rooms);
        if (rooms.length > 0) {
            // Keep active room if it exists and is still in the list
            if (activeRoomId && rooms.find(r => r.id === activeRoomId)) {
                // do nothing, keep active
            } else {
                const firstRoom = rooms[0];
                setActiveRoomId(firstRoom.id);
                loadMessages(firstRoom.id);
            }
        } else {
             // Fallback or empty
             setMessages([]);
        }
      } catch (err) {
          console.error("Error loading chat rooms", err);
          setMessages([]);
      }

      // Fetch Media
      await loadMedia(familyId);
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading family data", error);
      setIsLoading(false);
    }
  };

  // --- Room Management Handlers ---

  const handleRoomAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    // Validation Image
    if (!file.type.startsWith('image/')) {
        alert("Seules les images sont autorisées pour l'avatar.");
        return;
    }
    
    // Preview URL logic is handled by creating object URL in render or using the file directly
    if (isEdit) {
        setEditRoomAvatarFile(file);
    } else {
        setCreateRoomAvatarFile(file);
    }
    
    // Reset input value to allow re-selecting same file
    e.target.value = '';
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentFamily) return;

      try {
          let avatarUrl = roomFormData.avatarUrl;

          // Upload custom avatar if selected
          if (createRoomAvatarFile) {
              const uploaded = await mediaService.uploadFile(createRoomAvatarFile, currentFamily.familyId);
              avatarUrl = uploaded.urlPath;
          }

          const newRoom = await chatService.createRoom({
              ...roomFormData,
              avatarUrl,
              familyId: currentFamily.familyId
          });
          setChatRooms([...chatRooms, newRoom]);
          setShowCreateRoomModal(false);
          setActiveRoomId(newRoom.id);
          loadMessages(newRoom.id);
          // Reset form
          setRoomFormData({ familyId: 0, name: '', description: '', isPrivate: false, participantIds: [] });
          setCreateRoomAvatarFile(null);
      } catch (err) {
          console.error("Create room error", err);
          alert("Erreur lors de la création du salon.");
      }
  };

  const handleUpdateRoom = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingRoom || !currentFamily) return; // Added currentFamily check for upload
      
      try {
          let avatarUrl = editingRoom.avatarUrl;

           // Upload custom avatar if selected
           if (editRoomAvatarFile) {
              const uploaded = await mediaService.uploadFile(editRoomAvatarFile, currentFamily.familyId);
              avatarUrl = uploaded.urlPath;
          }

          const updated = await chatService.updateRoom({
              chatRoomId: editingRoom.id,
              name: editingRoom.name,
              description: editingRoom.description,
              channelType: editingRoom.channelType,
              avatarUrl // Add avatarUrl to update
          });
          
          setChatRooms(chatRooms.map(r => r.id === updated.id ? updated : r));
          setEditingRoom(updated); 
          setEditRoomAvatarFile(null);
          alert("Salon mis à jour !");
      } catch (err) {
          console.error("Update room error", err);
          alert("Erreur lors de la mise à jour.");
      }
  };

  const handleAddParticipantToRoom = async () => {
      if (!editingRoom || !participantToAdd) return;
      try {
           await chatService.addParticipant(editingRoom.id, participantToAdd);
           // Refresh room data to see new participant (simplest is to re-fetch rooms or manually update)
           alert("Participant ajouté !");
           const updatedRooms = await chatService.getChatRooms(currentFamily!.familyId);
           setChatRooms(updatedRooms);
           const updatedRoom = updatedRooms.find(r => r.id === editingRoom.id);
           if(updatedRoom) setEditingRoom(updatedRoom);
           setParticipantToAdd(null);
      } catch (err) {
          console.error("Add participant error", err);
          alert("Erreur lors de l'ajout.");
      }
  };

  const handleRemoveParticipantFromRoom = async (userId: number) => {
      if (!editingRoom) return;
      if (!window.confirm("Retirer ce participant ?")) return;
      try {
          await chatService.removeParticipant(editingRoom.id, userId);
           // Refresh
           const updatedRooms = await chatService.getChatRooms(currentFamily!.familyId);
           setChatRooms(updatedRooms);
           const updatedRoom = updatedRooms.find(r => r.id === editingRoom.id);
           if(updatedRoom) setEditingRoom(updatedRoom);
      } catch (err) {
           console.error("Remove participant error", err);
           alert("Erreur lors du retrait.");
      }
  };

  const getAvailableUsersForChat = () => {
      // Filter tree persons who have linkedUserId
      // In a real app, you might want a dedicated endpoint for "Family Members" with User details.
      // Here we rely on treeData.persons
      if (!treeData) return [];
      return treeData.persons.filter(p => p.linkedUserId).map(p => ({
          userId: p.linkedUserId!,
          name: `${p.firstName} ${p.lastName}`
      }));
  };

  const handleCreateFamily = async () => {
    const name = prompt("Entrez le nom de votre famille :");
    if (name) {
      try {
        await familyService.createFamily(name);
        alert("Famille créée !");
        window.location.reload(); 
      } catch (e) {
        alert("Erreur création famille");
      }
    }
  };

  const handleSearchFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const results = await familyService.searchFamilies(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la recherche");
    }
  };

  const handleJoinFamily = async (familyId: number) => {
    try {
      // Sending request with gender. relatedToPersonId is 0 (assuming backend handles "New Applicant" logic)
      await familyService.joinFamily({
        familyId,
        gender: joinGender,
        relatedToPersonId: 0, 
        relationshipType: 'UNION' // Defaulting, usually irrelevant for initial applicant
      });
      alert("Demande envoyée ! Un administrateur devra valider votre demande.");
      setShowJoinModal(false);
      // Optionally reload to check status (it will be PENDING)
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la demande (Déjà membre ou erreur serveur)");
    }
  };

  const handleAddPerson = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentFamily) return;
      if (!newPerson.firstName || !newPerson.lastName) {
          alert("Nom et Prénom requis");
          return;
      }
      
      // If tree has people, we MUST select a relation to keep the tree connected
      if (treeData?.persons && treeData.persons.length > 0 && !relatedPersonId) {
          alert("Veuillez sélectionner un membre parent/enfant/conjoint pour lier la nouvelle personne.");
          return;
      }

      try {
          // 1. Create the Person
          const createdPerson = await treeService.createPerson({
              familyId: currentFamily.familyId,
              firstName: newPerson.firstName,
              lastName: newPerson.lastName,
              gender: newPerson.gender as 'M'|'F'|'O',
              birthDate: newPerson.birthDate
          });

          // 2. Create the Relationship (if applicable)
          if (relatedPersonId && createdPerson.id) {
              let personAId = 0;
              let personBId = 0;
              let type: 'PARENTAL' | 'UNION' | 'SIBLING' = 'PARENTAL';

              switch (relationshipType) {
                  case 'CHILD': 
                      // Selected (Parent) -> New (Child)
                      personAId = relatedPersonId;
                      personBId = createdPerson.id;
                      type = 'PARENTAL';
                      break;
                  case 'PARENT': 
                      // New (Parent) -> Selected (Child)
                      personAId = createdPerson.id;
                      personBId = relatedPersonId;
                      type = 'PARENTAL';
                      break;
                  case 'SPOUSE':
                      // Order less important for UNION, but consistency is good
                      personAId = createdPerson.id;
                      personBId = relatedPersonId;
                      type = 'UNION';
                      break;
                  case 'SIBLING':
                      personAId = createdPerson.id;
                      personBId = relatedPersonId;
                      type = 'SIBLING';
                      break;
              }

              await treeService.createRelationship({
                  personAId,
                  personBId,
                  type,
                  isBiological: type === 'PARENTAL' || type === 'SIBLING' // Default assumption
              });
          }

          alert("Personne ajoutée et liée avec succès !");
          setShowAddPersonModal(false);
          // Reset form
          setNewPerson({ firstName: '', lastName: '', gender: 'M', birthDate: '' });
          setRelatedPersonId(null);
          setRelationshipType('CHILD');
          
          loadFamilyData(currentFamily.familyId); // Refresh tree
      } catch (error) {
          console.error("Error creating person/relationship", error);
          alert("Erreur lors de l'ajout. Vérifiez les données.");
      }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  /**
   * Gère la sélection de fichiers (stockage local, pas d'upload immédiat)
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validation de la taille (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      alert("Le fichier est trop volumineux. Taille maximale : 50MB");
      return;
    }

    // Ajouter le fichier à la liste des fichiers en attente
    setPendingFiles([...pendingFiles, file]);
    
    // Reset input pour permettre de sélectionner le même fichier à nouveau
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if ((!newMessage.trim() && pendingFiles.length === 0) || !activeRoomId || !currentFamily) return;
      
      try {
          setIsUploading(true);
          
          // 1. Uploader les fichiers en attente
          const uploadedMedia: MediaItem[] = [];
          for (let i = 0; i < pendingFiles.length; i++) {
              const file = pendingFiles[i];
              const media = await mediaService.uploadFile(
                  file,
                  currentFamily.familyId,
                  undefined,
                  (progress) => {
                      // Progression globale : (fichiers complétés + progression actuelle) / total
                      const globalProgress = Math.round(((i * 100) + progress) / pendingFiles.length);
                      setUploadProgress(globalProgress);
                  }
              );
              uploadedMedia.push(media);
          }
          
          const attachmentIds = uploadedMedia.map(m => m.id);

          // 2. Optimistic Update
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
          setMessages([...messages, tempMsg]);
          setNewMessage('');
          setPendingFiles([]);

          // 3. Envoyer le message au serveur
          await chatService.sendMessage({ 
              chatRoomId: activeRoomId, 
              content: tempMsg.content,
              attachmentIds: attachmentIds.length > 0 ? attachmentIds : undefined
          });
          
          // 4. Rafraîchir la liste des médias
          await loadMedia(currentFamily.familyId);
          
      } catch (err) {
          console.error("Failed to send message", err);
          alert("Erreur lors de l'envoi du message. Vérifiez votre connexion.");
      } finally {
          setIsUploading(false);
          setUploadProgress(0);
      }
  };

  if (isLoading) {
    return <div className="loader-page"><span className="loader"></span> Chargement...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Search Modal */}
      {showJoinModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setShowJoinModal(false)}><X size={24}/></button>
            <h2>Rejoindre une famille</h2>
            
            <form onSubmit={handleSearchFamily} className="search-form">
              <input 
                type="text" 
                placeholder="Rechercher par nom de famille..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit"><Search size={18}/></button>
            </form>

            <div className="gender-select">
                <label>Votre sexe (pour l'arbre) :</label>
                <select value={joinGender} onChange={(e) => setJoinGender(e.target.value as any)}>
                    <option value="M">Homme</option>
                    <option value="F">Femme</option>
                    <option value="O">Autre</option>
                </select>
            </div>

            <div className="search-results">
              {searchResults.map(fam => (
                <div key={fam.id} className="result-item">
                  <span>{fam.familyName}</span>
                  {fam.isMember ? (
                    <button disabled className="btn-joined">Déjà membre</button>
                  ) : (
                    <button onClick={() => handleJoinFamily(fam.id)}>Rejoindre</button>
                  )}
                </div>
              ))}
              {searchResults.length === 0 && searchQuery && <p>Aucun résultat trouvé.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Add Person Modal */}
      {showAddPersonModal && (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-btn" onClick={() => setShowAddPersonModal(false)}><X size={24}/></button>
                <h2>Ajouter une personne</h2>
                <form onSubmit={handleAddPerson} className="person-form">
                    <div className="form-group">
                        <label>Prénom</label>
                        <input type="text" required value={newPerson.firstName} onChange={e => setNewPerson({...newPerson, firstName: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label>Nom</label>
                        <input type="text" required value={newPerson.lastName} onChange={e => setNewPerson({...newPerson, lastName: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label>Date de naissance</label>
                        <input type="date" value={newPerson.birthDate} onChange={e => setNewPerson({...newPerson, birthDate: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label>Sexe</label>
                        <select value={newPerson.gender} onChange={e => setNewPerson({...newPerson, gender: e.target.value as any})}>
                            <option value="M">Homme</option>
                            <option value="F">Femme</option>
                            <option value="O">Autre</option>
                        </select>
                    </div>

                    {treeData?.persons && treeData.persons.length > 0 && (
                        <>
                            <div className="separator" style={{margin: '1rem 0', borderBottom: '1px solid #eee'}}></div>
                            <h3>Relation avec un membre existant</h3>
                            
                            <div className="form-group">
                                <label>Membre existant</label>
                                <select 
                                    value={relatedPersonId || ''} 
                                    onChange={e => setRelatedPersonId(Number(e.target.value))}
                                    required
                                >
                                    <option value="" disabled>Sélectionner...</option>
                                    {treeData.persons.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.firstName} {p.lastName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>La nouvelle personne est...</label>
                                <select 
                                    value={relationshipType} 
                                    onChange={e => setRelationshipType(e.target.value as any)}
                                >
                                    <option value="CHILD">Enfant de (Sélection)</option>
                                    <option value="PARENT">Parent de (Sélection)</option>
                                    <option value="SPOUSE">Conjoint(e) de (Sélection)</option>
                                    <option value="SIBLING">Frère/Sœur de (Sélection)</option>
                                </select>
                            </div>
                        </>
                    )}

                    <button type="submit" style={{marginTop: '1rem', width: '100%'}}>Ajouter & Lier</button>
                </form>
            </div>
        </div>
      )}

      {/* Create Room Modal */}
      {showCreateRoomModal && (
          <div className="modal-overlay">
              <div className="modal-content">
                  <button className="close-btn" onClick={() => setShowCreateRoomModal(false)}><X size={24}/></button>
                  <h2>Créer un salon</h2>
                  <form onSubmit={handleCreateRoom}>
                      <div className="form-group">
                          <label>Nom du salon</label>
                          <input 
                              type="text" 
                              required 
                              value={roomFormData.name} 
                              onChange={e => setRoomFormData({...roomFormData, name: e.target.value})} 
                          />
                      </div>
                      <div className="form-group">
                          <label>Description</label>
                          <input 
                              type="text" 
                              value={roomFormData.description || ''} 
                              onChange={e => setRoomFormData({...roomFormData, description: e.target.value})} 
                          />
                      </div>
                      <div className="form-group">
                          <label>Avatar du Salon</label>
                          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                              <input 
                                  ref={createAvatarInputRef}
                                  type="file" 
                                  accept="image/*"
                                  onChange={(e) => handleRoomAvatarSelect(e, false)}
                                  style={{display:'none'}}
                              />
                              <div 
                                  className="avatar-preview" 
                                  style={{
                                      width: '50px', 
                                      height: '50px', 
                                      borderRadius: '50%', 
                                      border: '2px solid #ddd', 
                                      overflow: 'hidden',
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center',
                                      background: '#f9f9f9',
                                      cursor: 'pointer'
                                  }}
                                  onClick={() => createAvatarInputRef.current?.click()}
                              >
                                  {createRoomAvatarFile ? (
                                      <img src={URL.createObjectURL(createRoomAvatarFile)} alt="Preview" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                                  ) : (
                                      <Image size={24} color="#ccc" />
                                  )}
                              </div>
                              <button 
                                  type="button" 
                                  className="secondary-btn"
                                  style={{padding: '5px 10px', fontSize: '0.9rem'}}
                                  onClick={() => createAvatarInputRef.current?.click()}
                              >
                                  Choisir une image
                              </button>
                               {createRoomAvatarFile && (
                                  <button 
                                      type="button" 
                                      className="remove-btn"
                                      style={{background: 'none', border:'none', color:'red', cursor:'pointer'}}
                                      onClick={() => setCreateRoomAvatarFile(null)}
                                  >
                                      x
                                  </button>
                              )}
                          </div>
                      </div>
                      <div className="form-group checkbox">
                          <label style={{display:'flex', alignItems:'center', gap: '10px'}}>
                              <input 
                                  type="checkbox" 
                                  checked={roomFormData.isPrivate} 
                                  onChange={e => setRoomFormData({...roomFormData, isPrivate: e.target.checked})} 
                              />
                              Salon Privé <Lock size={14}/>
                          </label>
                      </div>
                      {roomFormData.isPrivate && (
                         <div className="form-group">
                             <label>Participants initiaux</label>
                             <div className="multi-select">
                                 {getAvailableUsersForChat().map(u => (
                                     <label key={u.userId} style={{display:'block'}}>
                                         <input 
                                             type="checkbox"
                                             value={u.userId}
                                             disabled={u.userId === user?.id} // Can't unselect self (creator) usually handled by backend
                                             onChange={e => {
                                                 const checked = e.target.checked;
                                                 const val = Number(e.target.value);
                                                 setRoomFormData(prev => ({
                                                     ...prev,
                                                     participantIds: checked 
                                                         ? [...(prev.participantIds || []), val]
                                                         : (prev.participantIds || []).filter(id => id !== val)
                                                 }));
                                             }}
                                         /> {u.name}
                                     </label>
                                 ))}
                             </div>
                         </div>
                      )}
                      <button type="submit" className="btn-primary" style={{width: '100%', marginTop: '15px'}}>Créer</button>
                  </form>
              </div>
          </div>
      )}

      {/* Room Settings Modal */}
      {showRoomSettingsModal && editingRoom && (
          <div className="modal-overlay">
              <div className="modal-content">
                  <button className="close-btn" onClick={() => setShowRoomSettingsModal(false)}><X size={24}/></button>
                  <h2>Paramètres du salon</h2>
                  <form onSubmit={handleUpdateRoom}>
                      <div className="form-group">
                          <label>Nom</label>
                          <input 
                              type="text" 
                              value={editingRoom.name} 
                              onChange={e => setEditingRoom({...editingRoom, name: e.target.value})} 
                          />
                      </div>
                      <div className="form-group">
                          <label>Description</label>
                          <input 
                              type="text" 
                              value={editingRoom.description || ''} 
                              onChange={e => setEditingRoom({...editingRoom, description: e.target.value})} 
                          />
                      </div>
                      <div className="form-group">
                          <label>Avatar du Salon</label>
                           <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                              <input 
                                  ref={editAvatarInputRef}
                                  type="file" 
                                  accept="image/*"
                                  onChange={(e) => handleRoomAvatarSelect(e, true)}
                                  style={{display:'none'}}
                              />
                              <div 
                                  className="avatar-preview" 
                                  style={{
                                      width: '50px', 
                                      height: '50px', 
                                      borderRadius: '50%', 
                                      border: '2px solid #ddd', 
                                      overflow: 'hidden',
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center',
                                      background: '#f9f9f9',
                                      cursor: 'pointer'
                                  }}
                                  onClick={() => editAvatarInputRef.current?.click()}
                              >
                                  {editRoomAvatarFile ? (
                                      <img src={URL.createObjectURL(editRoomAvatarFile)} alt="Preview" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                                  ) : editingRoom.avatarUrl ? (
                                      <img src={getMediaUrl(editingRoom.avatarUrl)} alt="Current" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                                  ) : (
                                      <Image size={24} color="#ccc" />
                                  )}
                              </div>
                              <button 
                                  type="button" 
                                  className="secondary-btn"
                                  style={{padding: '5px 10px', fontSize: '0.9rem'}}
                                  onClick={() => editAvatarInputRef.current?.click()}
                              >
                                  Changer l'image
                              </button>
                               {editRoomAvatarFile && (
                                  <button 
                                      type="button" 
                                      className="remove-btn"
                                      style={{background: 'none', border:'none', color:'red', cursor:'pointer'}}
                                      onClick={() => setEditRoomAvatarFile(null)}
                                  >
                                      Annuler
                                  </button>
                              )}
                          </div>
                      </div>
                      <div className="form-group">
                          <label>Visibilité</label>
                          <select 
                              value={editingRoom.channelType} 
                              onChange={e => setEditingRoom({...editingRoom, channelType: e.target.value as 'PUBLIC'|'PRIVATE'})}
                          >
                              <option value="PUBLIC">Public</option>
                              <option value="PRIVATE">Privé</option>
                          </select>
                      </div>
                      
                      <button type="submit" className="btn-primary" style={{width: '100%', marginBottom: '20px'}}>Enregistrer</button>
                  </form>

                  <div className="separator"></div>

                  {editingRoom.channelType === 'PRIVATE' && (
                      <div className="participants-section">
                          <h3>Participants</h3>
                          <ul className="participants-list">
                              {editingRoom.participants?.map(p => (
                                  <li key={p.id}>
                                      <span>{p.displayName}</span>
                                      {/* Only allow removing others if you are admin - checking logic simplistic here */}
                                      {p.id !== user?.id && (
                                          <button className="icon-btn-small" onClick={() => handleRemoveParticipantFromRoom(p.id)} title="Retirer">
                                              <UserMinus size={14}/>
                                          </button>
                                      )}
                                  </li>
                              ))}
                          </ul>
                          <div className="add-participant" style={{marginTop: '10px', display: 'flex', gap: '10px'}}>
                              <select 
                                  onChange={e => setParticipantToAdd(Number(e.target.value))}
                                  value={participantToAdd || ''}
                              >
                                  <option value="">Ajouter un membre...</option>
                                  {getAvailableUsersForChat()
                                      .filter(u => !editingRoom.participants?.find(p => p.id === u.userId))
                                      .map(u => (
                                          <option key={u.userId} value={u.userId}>{u.name}</option>
                                      ))
                                  }
                              </select>
                              <button onClick={handleAddParticipantToRoom} disabled={!participantToAdd}><UserPlus size={16}/></button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Header */}
      <header>
        <div className="brand">
            <Flower className="tree-icon" />
            <h1>{currentFamily ? currentFamily.familyName.toUpperCase() : 'ARBRE GÉNÉALOGIQUE'}</h1>
        </div>
        <div className="user-controls">
            {currentFamily && (
              <>
                <button className={`btn-nav ${activeTab === 'TREE' ? 'active' : ''}`} onClick={() => setActiveTab('TREE')}>
                    <Users size={16} style={{marginRight: 8, verticalAlign: 'middle'}}/> Arbre
                </button>
                <button className={`btn-nav ${activeTab === 'CHAT' ? 'active' : ''}`} onClick={() => setActiveTab('CHAT')}>
                    <MessageCircle size={16} style={{marginRight: 8, verticalAlign: 'middle'}}/> Chat & Médias
                </button>
              </>
            )}
            <div className="profile">
                <div className="avatar">
                    {user?.displayName?.[0].toUpperCase() || 'U'}
                </div>
                <div className="info">
                    <span className="name">{user?.displayName || 'Utilisateur'}</span>
                    <span className="role">{currentFamily?.role || 'Visiteur'}</span>
                </div>
            </div>
            <button className="btn-nav icon-only" onClick={handleLogout} title="Déconnexion">
                <LogOut size={16}/>
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {!currentFamily ? (
          <div className="empty-state">
              <Users size={64} color="#326C58" />
              <h2>Bienvenue, {user?.displayName} !</h2>
              <p>Vous ne faites partie d'aucune famille pour l'instant.</p>
              <div className="actions">
                  <button onClick={handleCreateFamily}>Créer ma famille</button>
                  <button 
                    className="ghost" 
                    style={{color: '#326C58', borderColor: '#326C58'}} 
                    onClick={() => setShowJoinModal(true)}
                  >
                    Rejoindre une famille
                  </button>
              </div>
          </div>
        ) : (
            <>
                {/* Same Tree/Chat Views as before... */}
                {activeTab === 'TREE' && (
                    <div className="tree-visualizer">
                        {treeData?.persons && treeData.persons.length > 0 ? (
                            <div style={{position: 'relative', width: '100%', height: '100%'}}>
                        {/* Floating Add Button */}
                        <button 
                            className="fab-add" 
                            onClick={() => setShowAddPersonModal(true)}
                            title="Ajouter une personne"
                        >
                            <PlusCircle size={24} />
                        </button>

                        {/* ... SVG and Nodes ... */}
                        <svg className="connections">
                                    <line x1="50%" y1="100px" x2="30%" y2="250px" />
                                    <line x1="50%" y1="100px" x2="70%" y2="250px" />
                                </svg>
                                
                                <div className="tree-node" style={{top: '50px', left: 'calc(50% - 60px)'}}>
                                    <img src={`https://ui-avatars.com/api/?name=${treeData.persons[0].firstName}+${treeData.persons[0].lastName}&background=random`} alt="Avatar" />
                                    <span className="name">{treeData.persons[0].firstName} {treeData.persons[0].lastName}</span>
                                    <span className="dates">{treeData.persons[0].birthDate ? new Date(treeData.persons[0].birthDate).getFullYear() : '?'} - </span>
                                </div>
                                 
                                {treeData.persons.slice(1).map((p, i) => (
                                     <div key={p.id} className="tree-node" style={{top: '250px', left: `calc(${30 + (i * 40)}% - 60px)`}}>
                                        <img src={`https://ui-avatars.com/api/?name=${p.firstName}+${p.lastName}&background=random`} alt="Avatar" />
                                        <span className="name">{p.firstName} {p.lastName}</span>
                                        <span className="dates">{p.birthDate ? new Date(p.birthDate).getFullYear() : '?'}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="placeholder-msg">
                                <h3>Votre arbre est vide</h3>
                                <p>Commencez par ajouter des membres !</p>
                                <button onClick={() => setShowAddPersonModal(true)}><PlusCircle size={16} style={{marginRight: 5}}/> Ajouter une personne</button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'CHAT' && (
            <div className="chat-interface">
                <div className="sidebar">
                    <div className="sidebar-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding: '10px'}}>
                        <h3>Salons</h3>
                        <button onClick={() => setShowCreateRoomModal(true)} title="Nouveau salon" className="icon-btn">
                            <PlusCircle size={20} />
                        </button>
                    </div>
                    <div className="rooms">
                        {chatRooms.length > 0 ? chatRooms.map(room => (
                            <div 
                                key={room.id} 
                                className={`room-item ${activeRoomId === room.id ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveRoomId(room.id);
                                    loadMessages(room.id);
                                }}
                            >
                                {room.channelType === 'PRIVATE' ? <Lock size={12} style={{marginRight:5}}/> : <Globe size={12} style={{marginRight:5}}/>}
                                {room.name}
                            </div>
                        )) : (
                            <div className="room-item">Aucun salon</div>
                        )}
                    </div>
                </div>
                <div className="chat-area">
                    {/* Chat Header */}
                    {activeRoomId && (
                        <div className="chat-header" style={{
                            padding: '10px 20px', 
                            borderBottom: '1px solid #ddd', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            background: '#f9f9f9'
                        }}>
                            <div>
                                <h3 style={{margin:0}}>
                                    {chatRooms.find(r => r.id === activeRoomId)?.name}
                                </h3>
                                <small style={{color: '#666'}}>
                                    {chatRooms.find(r => r.id === activeRoomId)?.description}
                                </small>
                            </div>
                            <button 
                                className="icon-btn" 
                                onClick={() => {
                                    const room = chatRooms.find(r => r.id === activeRoomId);
                                    if(room) {
                                        setEditingRoom(room);
                                        setShowRoomSettingsModal(true);
                                    }
                                }}
                                title="Paramètres du salon"
                            >
                                <Settings size={20}/>
                            </button>
                        </div>
                    )}

                    <div className="messages">
                        {messages.length === 0 ? (
                            <div style={{textAlign: 'center', opacity: 0.5, marginTop: '20px'}}>
                                {activeRoomId ? "Aucun message. Dites bonjour !" : "Sélectionnez un salon"}
                            </div>
                        ) : (
                            messages.map(msg => (
                                <div key={msg.id} className={`msg ${msg.sender.id === user?.id ? 'sent' : 'received'}`}>
                                    <span className="sender">{msg.sender.displayName}</span>
                                    {msg.content && <p className="content">{msg.content}</p>}
                                    
                                    {msg.attachments && msg.attachments.length > 0 && (
                                        <div className="msg-attachments">
                                            {msg.attachments.map(att => (
                                                <div key={att.id} className="attachment">
                                                    {att.mediaType === 'IMAGE' ? (
                                                        <img src={getMediaUrl(att.urlPath)} alt="attachment" onClick={() => window.open(getMediaUrl(att.urlPath), '_blank')} />
                                                    ) : att.mediaType === 'VIDEO' ? (
                                                        <video src={getMediaUrl(att.urlPath)} controls style={{maxWidth: '200px'}} />
                                                    ) : (
                                                        <a href={getMediaUrl(att.urlPath)} target="_blank" rel="noopener noreferrer">📄 Fichier joint</a>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                    {activeRoomId && (
                        <div className="input-container">
                            {/* Upload Progress */}
                            {isUploading && (
                                <div className="upload-progress" style={{
                                    padding: '10px',
                                    background: '#f0f0f0',
                                    borderRadius: '8px',
                                    marginBottom: '10px'
                                }}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
                                        <span style={{fontSize: '0.85rem', color: '#666'}}>Upload en cours...</span>
                                        <span style={{fontSize: '0.85rem', fontWeight: 'bold', color: '#326C58'}}>{uploadProgress}%</span>
                                    </div>
                                    <div style={{
                                        width: '100%',
                                        height: '6px',
                                        background: '#ddd',
                                        borderRadius: '3px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${uploadProgress}%`,
                                            height: '100%',
                                            background: 'linear-gradient(90deg, #326C58, #4A9B7F)',
                                            transition: 'width 0.3s ease'
                                        }} />
                                    </div>
                                </div>
                            )}

                            {/* Hidden File Input */}
                            <input 
                                ref={fileInputRef}
                                type="file" 
                                accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                            />

                            <form className="input-area" onSubmit={handleSendMessage}>
                                {/* Attachments Preview - À gauche */}
                                {pendingFiles.length > 0 && (
                                    <div className="attachments-preview-inline">
                                        {pendingFiles.map((file, index) => {
                                            const previewUrl = URL.createObjectURL(file);
                                            const isImage = file.type.startsWith('image/');
                                            
                                            return (
                                                <div key={index} className="att-item">
                                                    {isImage ? (
                                                        <img src={previewUrl} alt={file.name} onLoad={() => URL.revokeObjectURL(previewUrl)} />
                                                    ) : (
                                                        <div className="file-icon">
                                                            {file.type.startsWith('video/') ? 'VIDEO' : 'FILE'}
                                                        </div>
                                                    )}
                                                    <button 
                                                        type="button"
                                                        className="remove-btn"
                                                        onClick={() => setPendingFiles(pendingFiles.filter((_, i) => i !== index))}
                                                    >x</button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                
                                {/* Bouton Attach */}
                                <button 
                                    type="button" 
                                    className="attach-btn" 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    title="Joindre un fichier"
                                    style={{
                                        opacity: isUploading ? 0.5 : 1,
                                        cursor: isUploading ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    <Image size={16}/>
                                </button>
                                
                                {/* Input */}
                                <input 
                                    type="text" 
                                    placeholder="Écrivez votre message..." 
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                                
                                {/* Bouton Send - À droite */}
                                <button type="submit" className="send-btn"><ArrowRight size={16}/></button>
                            </form>
                        </div>
                    )}
                </div>
                <div className="media-sidebar">
                    <h4>Médias récents</h4>
                    
                    <div className="media-tabs">
                        <button className={mediaFilter === 'ALL' ? 'active' : ''} onClick={() => setMediaFilter('ALL')}>Tous</button>
                        <button className={mediaFilter === 'IMAGE' ? 'active' : ''} onClick={() => setMediaFilter('IMAGE')}>Img</button>
                        <button className={mediaFilter === 'VIDEO' ? 'active' : ''} onClick={() => setMediaFilter('VIDEO')}>Vid</button>
                        <button className={mediaFilter === 'FILE' ? 'active' : ''} onClick={() => setMediaFilter('FILE')}>Doc</button>
                    </div>

                    <div className="media-grid">
                        {mediaList.length > 0 ? mediaList.slice(0, 4).map(media => (
                            <div key={media.id} className="media-item">
                                {media.mediaType === 'IMAGE' ? (
                                    <img src={getMediaUrl(media.urlPath)} alt="Media" />
                                ) : (
                                    <div style={{background: '#333', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
                                        {media.mediaType === 'VIDEO' ? 'Vidéo' : 'Fichier'}
                                    </div>
                                )}
                            </div>
                        )) : (
                            <p style={{fontSize: '0.8rem', opacity: 0.6}}>Aucun média</p>
                        )}
                    </div>
                </div>
            </div>
        )}
            </>
        )}
      </main>
    </div>
  )
}
