import { memo, useState } from 'react';
import { Users, UserPlus, UserX } from 'lucide-react';
import type { PendingMember } from '../../services/family.service';
import type { MemberStatus } from '../../services/member.service';

interface PendingMembersPanelProps {
  currentFamily: MemberStatus | null;
  pendingMembers: PendingMember[];
  onValidate: (targetMemberId: number, vote: 'APPROVE' | 'REJECT') => Promise<boolean>;
}

export const PendingMembersPanel = memo(({
  currentFamily,
  pendingMembers,
  onValidate
}: PendingMembersPanelProps) => {
  const [loadingId, setLoadingId] = useState<number | null>(null);

  if (!currentFamily) return null;

  const familyPending = pendingMembers.filter(
    (m) => m.familyId === currentFamily.familyId
  );

  if (familyPending.length === 0) return null;

  const handleVote = async (memberId: number, vote: 'APPROVE' | 'REJECT') => {
    setLoadingId(memberId);
    try {
      const ok = await onValidate(memberId, vote);
      if (!ok) {
        alert("Impossible d'enregistrer votre vote. Réessayez plus tard.");
      }
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="pending-members-panel">
      <div className="panel-header">
        <div className="title">
          <Users size={18} />
          <div>
            <h3>Demandes d'adhésion en attente</h3>
            <p>{familyPending.length} personne(s) souhaitent rejoindre votre famille.</p>
          </div>
        </div>
      </div>
      <div className="panel-body">
        {familyPending.map((member) => (
          <div key={member.id} className="pending-member-card">
            <div className="member-main">
              <div className="avatar">
                {member.profilePictureUrl ? (
                  <img src={member.profilePictureUrl} alt={member.userDisplayName || member.userEmail} />
                ) : (
                  <span>{(member.userDisplayName || member.userEmail || '?')[0]?.toUpperCase()}</span>
                )}
              </div>
              <div className="info">
                <div className="name">
                  {member.userDisplayName || member.userEmail}
                </div>
                <div className="meta">
                  <span className="email">{member.userEmail}</span>
                  <span className="date">
                    Demandé le {new Date(member.joinedAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                {member.applicationData && (
                  <div className="application">
                    <span>
                      Genre : {member.applicationData.gender === 'M' ? 'Homme' : member.applicationData.gender === 'F' ? 'Femme' : 'Autre'}
                    </span>
                    {member.applicationData.relationshipType && (
                      <span>
                        Lien : {member.applicationData.relationshipType === 'PARENTAL'
                          ? 'Parental'
                          : member.applicationData.relationshipType === 'UNION'
                          ? 'Union'
                          : 'Fratrie'}
                      </span>
                    )}
                    {member.applicationData.relatedToPersonId && (
                      <span>
                        Personne liée : #{member.applicationData.relatedToPersonId}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="actions">
              <button
                className="approve-btn"
                disabled={loadingId === member.id}
                onClick={() => handleVote(member.id, 'APPROVE')}
              >
                <UserPlus size={16} />
                Approuver
              </button>
              <button
                className="reject-btn"
                disabled={loadingId === member.id}
                onClick={() => handleVote(member.id, 'REJECT')}
              >
                <UserX size={16} />
                Rejeter
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

