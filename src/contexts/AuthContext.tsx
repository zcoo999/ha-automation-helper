import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  ws: WebSocket | null;
  login: (ip: string, token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ws, setWs] = useState<WebSocket | null>(null);

  const login = (ip: string, token: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
      // Remove :8123 if it's included in the IP
      const cleanIp = ip.replace(':8123', '');
      const url = `${protocol}${cleanIp}:8123/api/websocket`;
      const newWs = new WebSocket(url);

      const timeout = setTimeout(() => {
        newWs.close();
        reject(new Error('Connection timeout'));
      }, 5000);

      newWs.onopen = () => {
        newWs.send(JSON.stringify({
          type: "auth",
          access_token: token
        }));
      };

      newWs.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === "auth_ok") {
          clearTimeout(timeout);
          localStorage.setItem('ha_ip', cleanIp);
          localStorage.setItem('ha_token', token);
          setWs(newWs);
          resolve();
        } else if (data.type === "auth_invalid") {
          clearTimeout(timeout);
          newWs.close();
          reject(new Error('Invalid authentication'));
        }
      };

      newWs.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Connection error'));
      };
    });
  };

  const logout = () => {
    if (ws) {
      ws.close();
      setWs(null);
    }
    localStorage.removeItem('ha_ip');
    localStorage.removeItem('ha_token');
    localStorage.removeItem('selected_entities');
  };

  return (
    <AuthContext.Provider value={{ ws, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}