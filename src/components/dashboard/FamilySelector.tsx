import { memo, useEffect } from 'react';
import { ArrowRight, Flower } from 'lucide-react';
import { type MemberStatus } from '../../services/member.service';

interface FamilySelectorProps {
  currentFamily: MemberStatus | null;
  userFamilies: MemberStatus[];
  showFamilySelector: boolean;
  setShowFamilySelector: (show: boolean) => void;
  onFamilySwitch: (family: MemberStatus) => void;
}

export const FamilySelector = memo(({
  currentFamily,
  userFamilies,
  showFamilySelector,
  setShowFamilySelector,
  onFamilySwitch
}: FamilySelectorProps) => {
  // Fermer le sélecteur quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFamilySelector) {
        const target = event.target as Element;
        if (!target.closest('.family-selector-container')) {
          setShowFamilySelector(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFamilySelector, setShowFamilySelector]);

  return (
    <div className="brand">
      <Flower className="tree-icon" />
      <div className="family-selector-container">
        {currentFamily ? (
          <div className="family-selector" onClick={() => setShowFamilySelector(!showFamilySelector)}>
            <h1>{currentFamily.familyName.toUpperCase()}</h1>
            <div className="family-role">{currentFamily.role} • {currentFamily.status}</div>
            {userFamilies.length > 1 && (
              <div className="family-dropdown-icon">
                <ArrowRight size={16} style={{ 
                  transform: showFamilySelector ? 'rotate(90deg)' : 'rotate(0deg)', 
                  transition: 'transform 0.2s' 
                }} />
              </div>
            )}
          </div>
        ) : (
          <h1>ARBRE GÉNÉALOGIQUE</h1>
        )}
        
        {/* Dropdown des familles */}
        {showFamilySelector && userFamilies.length > 1 && (
          <div className="family-dropdown">
            {userFamilies.map((family) => (
              <div 
                key={family.familyId}
                className={`family-option ${currentFamily?.familyId === family.familyId ? 'active' : ''}`}
                onClick={() => onFamilySwitch(family)}
              >
                <div className="family-name">{family.familyName}</div>
                <div className="family-meta">
                  <span className={`status ${family.status.toLowerCase()}`}>{family.status}</span>
                  <span className="role">{family.role}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});