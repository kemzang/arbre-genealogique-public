import React, { useState, useEffect } from 'react';
import { authService, type User } from '../services/auth.service';

export const AuthTest: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [rawUserData, setRawUserData] = useState<string>('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    // Get raw data from localStorage
    const rawData = localStorage.getItem('user');
    setRawUserData(rawData || 'No user data');

    // Get validated user
    const validatedUser = authService.validateAndFixUserData();
    setUser(validatedUser);

    // Check admin status
    const adminStatus = authService.isSuperAdmin(validatedUser);
    setIsAdmin(adminStatus);
  };

  const clearAuth = () => {
    authService.clearAllAuthData();
    checkAuth();
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      border: '1px solid #ccc', 
      padding: '10px', 
      borderRadius: '5px',
      maxWidth: '300px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <h4>Auth Test Component</h4>
      
      <div>
        <strong>User:</strong> {user ? user.displayName : 'null'}
      </div>
      
      <div>
        <strong>Is Super Admin:</strong> {isAdmin ? 'Yes' : 'No'}
      </div>
      
      <div>
        <strong>User ID:</strong> {user?.id || 'N/A'}
      </div>
      
      <div>
        <strong>isSuperAdmin prop:</strong> {user?.isSuperAdmin ? 'true' : 'false'}
      </div>
      
      <div>
        <strong>Role:</strong> {user?.role || 'N/A'}
      </div>
      
      <details>
        <summary>Raw localStorage data</summary>
        <pre style={{ fontSize: '10px', maxHeight: '100px', overflow: 'auto' }}>
          {rawUserData}
        </pre>
      </details>
      
      <div style={{ marginTop: '10px' }}>
        <button onClick={checkAuth} style={{ marginRight: '5px', fontSize: '10px' }}>
          Refresh
        </button>
        <button onClick={clearAuth} style={{ fontSize: '10px' }}>
          Clear Auth
        </button>
      </div>
    </div>
  );
};