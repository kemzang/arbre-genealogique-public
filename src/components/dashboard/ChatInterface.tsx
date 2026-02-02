import React, { memo, useRef } from 'react';
import { 
  PlusCircle, 
  Settings, 
  Globe, 
  Lock, 
  Image, 
  ArrowRight, 
  X,
  UserPlus,
  UserMinus,
  Download,
  FileText
} from 'lucide-react';
import { type ChatRoom, type Message, type CreateRoomRequest } from '../../services/chat.service';
import { type User } from '../../services/auth.service';
import { type MediaItem } from '../../services/media.service';
import { type Person } from '../../services/tree.service';

interface ChatInterfaceProps {
  // Data
  chatRooms: ChatRoom[];
  messages: Message[];
  mediaList: MediaItem[];
  user: User | null;
  treeData: { persons: Person[] } | null;
  
  // Chat state
  activeRoomId: number | null;
  newMessage: string;
  pendingFiles: File[];
  uploadProgress: number;
  isUploading: boolean;
  mediaFilter: 'ALL' | 'IMAGE' | 'VIDEO' | 'FILE';
  
  // Modal states
  showCreateRoomModal: boolean;
  showRoomSettingsModal: boolean;
  roomFormData: CreateRoomRequest;
  editingRoom: ChatRoom | null;
  participantToAdd: number | null;
  createRoomAvatarFile: File | null;
  editRoomAvatarFile: File | null;
  
  // Actions
  setActiveRoomId: (id: number | null) => void;
  setNewMessage: (message: string) => void;
  setPendingFiles: (files: File[]) => void;
  setMediaFilter: (filter: 'ALL' | 'IMAGE' | 'VIDEO' | 'FILE') => void;
  setShowCreateRoomModal: (show: boolean) => void;
  setShowRoomSettingsModal: (show: boolean) => void;
  setRoomFormData: (data: CreateRoomRequest) => void;
  setEditingRoom: (room: ChatRoom | null) => void;
  setParticipantToAdd: (id: number | null) => void;
  setCreateRoomAvatarFile: (file: File | null) => void;
  setEditRoomAvatarFile: (file: File | null) => void;
  
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSendMessage: (e: React.FormEvent) => void;
  onCreateRoom: () => void;
  onUpdateRoom: () => void;
  onLoadMessages: (roomId: number) => void;
  onOpenMediaViewer: (media: any, mediaList: any[], index: number) => void;
  getMediaUrl: (urlPath: string) => string;
}

export const ChatInterface = memo(({
  // Data
  chatRooms,
  messages,
  mediaList,
  user,
  treeData,
  
  // Chat state
  activeRoomId,
  newMessage,
  pendingFiles,
  uploadProgress,
  isUploading,
  mediaFilter,
  
  // Modal states
  showCreateRoomModal,
  showRoomSettingsModal,
  roomFormData,
  editingRoom,
  participantToAdd,
  createRoomAvatarFile,
  editRoomAvatarFile,
  
  // Actions
  setActiveRoomId,
  setNewMessage,
  setPendingFiles,
  setMediaFilter,
  setShowCreateRoomModal,
  setShowRoomSettingsModal,
  setRoomFormData,
  setEditingRoom,
  setParticipantToAdd,
  setCreateRoomAvatarFile,
  setEditRoomAvatarFile,
  
  onFileSelect,
  onSendMessage,
  onCreateRoom,
  onUpdateRoom,
  onLoadMessages,
  onOpenMediaViewer,
  getMediaUrl
}: ChatInterfaceProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createAvatarInputRef = useRef<HTMLInputElement>(null);
  const editAvatarInputRef = useRef<HTMLInputElement>(null);

  const getAvailableUsersForChat = () => {
    if (!treeData) return [];
    return treeData.persons.filter((p: Person) => p.linkedUserId).map((p: Person) => ({
      userId: p.linkedUserId!,
      name: `${p.firstName} ${p.lastName}`
    }));
  };

  const handleRoomAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    if (!file.type.startsWith('image/')) {
      alert("Seules les images sont autorisées pour l'avatar.");
      return;
    }
    
    if (isEdit) {
      setEditRoomAvatarFile(file);
    } else {
      setCreateRoomAvatarFile(file);
    }
    
    e.target.value = '';
  };

  return (
    <div className="chat-interface">
      {/* Create Room Modal */}
      {showCreateRoomModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setShowCreateRoomModal(false)}>
              <X size={24}/>
            </button>
            <h2>Créer un salon</h2>
            <form onSubmit={(e) => { e.preventDefault(); onCreateRoom(); }}>
              <div className="form-group">
                <label>Nom du salon</label>
                <input 
                  type="text" 
                  required 
                  value={roomFormData.name} 
                  onChange={(e) => setRoomFormData({...roomFormData, name: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input 
                  type="text" 
                  value={roomFormData.description || ''} 
                  onChange={(e) => setRoomFormData({...roomFormData, description: e.target.value})} 
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
                    onClick={() => createAvatarInputRef.current?.click()}
                  >
                    Changer l'image
                  </button>
                  {createRoomAvatarFile && (
                    <button 
                      type="button" 
                      className="remove-btn"
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
                    onChange={(e) => setRoomFormData({...roomFormData, isPrivate: e.target.checked})} 
                  />
                  Salon Privé <Lock size={14}/>
                </label>
              </div>
              {roomFormData.isPrivate && (
                <div className="form-group">
                  <label>Participants initiaux</label>
                  <div className="multi-select">
                    {getAvailableUsersForChat().map((u: { userId: number, name: string }) => (
                      <label key={u.userId} style={{display:'block'}}>
                        <input 
                          type="checkbox"
                          value={u.userId}
                          disabled={u.userId === user?.id}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const val = Number(e.target.value);
                            const updatedFormData = {
                              ...roomFormData,
                              participantIds: checked 
                                ? [...(roomFormData.participantIds || []), val]
                                : (roomFormData.participantIds || []).filter((id: number) => id !== val)
                            };
                            setRoomFormData(updatedFormData);
                          }}
                        /> {u.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <button type="submit" className="btn-primary" style={{width: '100%', marginTop: '15px'}}>
                Créer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Room Settings Modal */}
      {showRoomSettingsModal && editingRoom && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setShowRoomSettingsModal(false)}>
              <X size={24}/>
            </button>
            <h2>Paramètres du salon</h2>
            <form onSubmit={(e) => { e.preventDefault(); onUpdateRoom(); }}>
              <div className="form-group">
                <label>Nom</label>
                <input 
                  type="text" 
                  value={editingRoom.name} 
                  onChange={(e) => setEditingRoom({...editingRoom, name: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input 
                  type="text" 
                  value={editingRoom.description || ''} 
                  onChange={(e) => setEditingRoom({...editingRoom, description: e.target.value})} 
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
                    onClick={() => editAvatarInputRef.current?.click()}
                  >
                    Changer l'image
                  </button>
                  {editRoomAvatarFile && (
                    <button 
                      type="button" 
                      className="remove-btn"
                      onClick={() => setEditRoomAvatarFile(null)}
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{width: '100%', marginBottom: '20px'}}>
                Enregistrer
              </button>
            </form>

            {editingRoom.channelType === 'PRIVATE' && (
              <div className="participants-section">
                <h3>Participants</h3>
                <ul className="participants-list">
                  {editingRoom.participants?.map((p: { id: number, displayName: string }) => (
                    <li key={p.id}>
                      <span>{p.displayName}</span>
                      {p.id !== user?.id && (
                        <button className="icon-btn-small" title="Retirer">
                          <UserMinus size={14}/>
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="add-participant" style={{marginTop: '10px', display: 'flex', gap: '10px'}}>
                  <select 
                    onChange={(e) => setParticipantToAdd(Number(e.target.value))}
                    value={participantToAdd || ''}
                  >
                    <option value="">Ajouter un membre...</option>
                    {getAvailableUsersForChat()
                      .filter((u: { userId: number, name: string }) => !editingRoom.participants?.find((p: { id: number }) => p.id === u.userId))
                      .map((u: { userId: number, name: string }) => (
                        <option key={u.userId} value={u.userId}>{u.name}</option>
                      ))
                    }
                  </select>
                  <button disabled={!participantToAdd}>
                    <UserPlus size={16}/>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sidebar */}
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
                onLoadMessages(room.id);
              }}
            >
              <div className="room-avatar">
                {room.avatarUrl ? (
                  <img 
                    src={getMediaUrl(room.avatarUrl)} 
                    alt={`Avatar ${room.name}`}
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                      const defaultAvatar = target.nextElementSibling as HTMLElement;
                      if (defaultAvatar) {
                        defaultAvatar.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div 
                  className="room-avatar-default"
                  style={{
                    display: room.avatarUrl ? 'none' : 'flex'
                  }}
                >
                  {room.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="room-info">
                <div className="room-name">
                  {room.channelType === 'PRIVATE' ? <Lock size={12} style={{marginRight:5}}/> : <Globe size={12} style={{marginRight:5}}/>}
                  {room.name}
                </div>
                {room.description && (
                  <div className="room-description">
                    {room.description}
                  </div>
                )}
              </div>
            </div>
          )) : (
            <div className="room-item no-rooms">Aucun salon</div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-area">
        {/* Chat Header */}
        {activeRoomId && (() => {
          const currentRoom = chatRooms.find(r => r.id === activeRoomId);
          return (
            <div className="chat-header" style={{
              padding: '15px 20px', 
              borderBottom: '1px solid #ddd', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              background: '#f9f9f9'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="chat-header-avatar" style={{
                  width: '48px',
                  height: '48px',
                  position: 'relative',
                  flexShrink: 0
                }}>
                  {currentRoom?.avatarUrl ? (
                    <img 
                      src={getMediaUrl(currentRoom.avatarUrl)} 
                      alt={`Avatar ${currentRoom.name}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid #326C58',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = 'none';
                        const defaultAvatar = target.nextElementSibling as HTMLElement;
                        if (defaultAvatar) {
                          defaultAvatar.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div 
                    style={{
                      display: currentRoom?.avatarUrl ? 'none' : 'flex',
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #326C58 0%, #4A9B7F 100%)',
                      color: 'white',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: '900',
                      border: '3px solid #326C58',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                    }}
                  >
                    {currentRoom?.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                
                <div>
                  <h3 style={{margin:0, color: '#326C58', fontSize: '18px', fontWeight: '700'}}>
                    {currentRoom?.channelType === 'PRIVATE' ? <Lock size={16} style={{marginRight:8, verticalAlign: 'middle'}}/> : <Globe size={16} style={{marginRight:8, verticalAlign: 'middle'}}/>}
                    {currentRoom?.name}
                  </h3>
                  {currentRoom?.description && (
                    <small style={{color: '#666', fontSize: '13px'}}>
                      {currentRoom.description}
                    </small>
                  )}
                </div>
              </div>
              <button 
                className="icon-btn" 
                onClick={() => {
                  if(currentRoom) {
                    setEditingRoom(currentRoom);
                    setShowRoomSettingsModal(true);
                  }
                }}
                title="Paramètres du salon"
              >
                <Settings size={20} color="#326C58"/>
              </button>
            </div>
          );
        })()}

        <div className="messages">
          {messages.length === 0 ? (
            <div style={{textAlign: 'center', opacity: 0.5, marginTop: '20px'}}>
              {activeRoomId ? "Aucun message. Dites bonjour !" : "Sélectionnez un salon"}
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className={`msg ${msg.sender?.id === user?.id ? 'sent' : 'received'}`}>
                <span className="sender">{msg.sender?.displayName || 'Utilisateur'}</span>
                {msg.content && <p className="content">{msg.content}</p>}
                
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="msg-attachments">
                    {msg.attachments.map((att, index) => (
                      <div key={att.id} className="attachment">
                        {att.mediaType === 'IMAGE' ? (
                          <img 
                            src={getMediaUrl(att.urlPath)} 
                            alt="attachment" 
                            onClick={() => onOpenMediaViewer(att, msg.attachments!, index)}
                            className="attachment-image"
                          />
                        ) : att.mediaType === 'VIDEO' ? (
                          <div className="attachment-video" onClick={() => onOpenMediaViewer(att, msg.attachments!, index)}>
                            <video src={getMediaUrl(att.urlPath)} style={{maxWidth: '200px', cursor: 'pointer'}} />
                            <div className="video-overlay">
                              <div className="play-button">▶</div>
                            </div>
                          </div>
                        ) : (
                          <div className="attachment-file">
                            <FileText size={24} color="#666" />
                            <div className="file-info">
                              <span className="file-name">Fichier joint</span>
                              <a 
                                href={getMediaUrl(att.urlPath)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="file-download"
                              >
                                <Download size={16} />
                                Télécharger
                              </a>
                            </div>
                          </div>
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
              onChange={onFileSelect}
              style={{ display: 'none' }}
            />

            <form className="input-area" onSubmit={onSendMessage}>
              {/* Attachments Preview */}
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
              
              {/* Bouton Send */}
              <button type="submit" className="send-btn">
                <ArrowRight size={16}/>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Media Sidebar */}
      <div className="media-sidebar">
        <h4>Médias récents</h4>
        
        <div className="media-tabs">
          <button className={mediaFilter === 'ALL' ? 'active' : ''} onClick={() => setMediaFilter('ALL')}>Tous</button>
          <button className={mediaFilter === 'IMAGE' ? 'active' : ''} onClick={() => setMediaFilter('IMAGE')}>Img</button>
          <button className={mediaFilter === 'VIDEO' ? 'active' : ''} onClick={() => setMediaFilter('VIDEO')}>Vid</button>
          <button className={mediaFilter === 'FILE' ? 'active' : ''} onClick={() => setMediaFilter('FILE')}>Doc</button>
        </div>

        <div className="media-grid">
          {mediaList.length > 0 ? mediaList.slice(0, 4).map((media, index) => (
            <div key={media.id} className="media-item" onClick={() => onOpenMediaViewer(media, mediaList, index)}>
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
  );
});