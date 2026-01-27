import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, PlusCircle, Flower, MessageCircle, Image, LogOut, Users, Search, X } from 'lucide-react';
import './dashboard.scss';
import { authService, type User } from '../../services/auth.service';
import { familyService, type Family } from '../../services/family.service';
import { treeService, type TreeData } from '../../services/tree.service';
import { chatService, type Message } from '../../services/chat.service';
import { memberService, type MemberStatus } from '../../services/member.service';
import { mediaService, type MediaItem } from '../../services/media.service';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [currentFamily, setCurrentFamily] = useState<MemberStatus | null>(null);
  const [activeTab, setActiveTab] = useState<'TREE' | 'CHAT'>('TREE');
  const [treeData, setTreeData] = useState<TreeData | null>(null);
  
  // Chat & Media State
  const [chatRooms, setChatRooms] = useState<{id: number, name: string}[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Search / Join States
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Family[]>([]);
  const [joinGender, setJoinGender] = useState<'M'|'F'|'O'>('M');

  // Add Person State
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [newPerson, setNewPerson] = useState({
    firstName: '',
    lastName: '',
    gender: 'M',
    birthDate: ''
  });

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
            const firstRoom = rooms[0];
            setActiveRoomId(firstRoom.id);
            const msgs = await chatService.getMessages(firstRoom.id);
            setMessages(msgs);
        } else {
             // Fallback or empty
             setMessages([]);
        }
      } catch (err) {
          console.error("Error loading chat rooms", err);
          setMessages([]);
      }

      // Fetch Media
      try {
          const media = await mediaService.getRecentMedia(familyId);
          setMediaList(media);
      } catch (err) {
          console.error("Error loading media", err);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading family data", error);
      setIsLoading(false);
    }
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
      
      try {
          await treeService.createPerson({
              familyId: currentFamily.familyId,
              firstName: newPerson.firstName,
              lastName: newPerson.lastName,
              gender: newPerson.gender as 'M'|'F'|'O',
              birthDate: newPerson.birthDate
          });
          alert("Personne ajoutée !");
          setShowAddPersonModal(false);
          setNewPerson({ firstName: '', lastName: '', gender: 'M', birthDate: '' });
          loadFamilyData(currentFamily.familyId); // Refresh tree
      } catch (error) {
          console.error("Error creating person", error);
          alert("Erreur lors de l'ajout");
      }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !activeRoomId) return;
      
      // Optimistic Update
      const tempMsg: Message = {
          id: Date.now(),
          content: newMessage,
          sentAt: new Date().toISOString(),
          sender: { 
              id: user?.id || 0, 
              displayName: user?.displayName || user?.email || 'Moi', 
              email: user?.email || '' 
          }
      };
      setMessages([...messages, tempMsg]);
      setNewMessage('');

      try {
          await chatService.sendMessage({ chatRoomId: activeRoomId, content: tempMsg.content });
      } catch (err) {
          console.error("Failed to send", err);
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
                    <button type="submit" style={{marginTop: '1rem', width: '100%'}}>Ajouter</button>
                </form>
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
                    <h3>Salons de discussion</h3>
                    <div className="rooms">
                        {chatRooms.length > 0 ? chatRooms.map(room => (
                            <div 
                                key={room.id} 
                                className={`room-item ${activeRoomId === room.id ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveRoomId(room.id);
                                    chatService.getMessages(room.id).then(setMessages);
                                }}
                            >
                                # {room.name}
                            </div>
                        )) : (
                            <div className="room-item">Aucun salon</div>
                        )}
                    </div>
                </div>
                <div className="chat-area">
                    <div className="messages">
                        {messages.length === 0 ? (
                            <div style={{textAlign: 'center', opacity: 0.5, marginTop: '20px'}}>
                                {activeRoomId ? "Aucun message. Dites bonjour !" : "Sélectionnez un salon"}
                            </div>
                        ) : (
                            messages.map(msg => (
                                <div key={msg.id} className={`msg ${msg.sender.email === user?.email ? 'sent' : 'received'}`}>
                                    <span className="sender">{msg.sender.displayName}</span>
                                    {msg.content}
                                </div>
                            ))
                        )}
                    </div>
                    {activeRoomId && (
                        <form className="input-area" onSubmit={handleSendMessage}>
                            <input 
                                type="text" 
                                placeholder="Écrivez votre message..." 
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                            <button type="submit" className="send-btn"><ArrowRight size={20}/></button>
                        </form>
                    )}
                </div>
                <div className="media-sidebar">
                    <h4>Médias récents</h4>
                    <div className="media-grid">
                        {mediaList.length > 0 ? mediaList.slice(0, 4).map(media => (
                            <div key={media.id} className="media-item">
                                {media.type === 'IMAGE' ? (
                                    <img src={media.url} alt="Media" />
                                ) : (
                                    <div style={{background: '#333', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>Vidéo</div>
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
