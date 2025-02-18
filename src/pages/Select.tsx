import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { CheckSquare, LogOut, Square } from 'lucide-react';

interface Entity {
  entity_id: string;
  attributes: {
    friendly_name?: string;
  };
}

export default function Select() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { ws, logout } = useAuth();

  useEffect(() => {
    if (!ws) {
      navigate('/login');
      return;
    }

    const msgId = Date.now();
    ws.send(JSON.stringify({
      id: msgId,
      type: "get_states"
    }));

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.type === "result" && data.success && data.result) {
        const lightEntities = data.result.filter((entity: Entity) => 
          entity.entity_id.startsWith('light.')
        );
        setEntities(lightEntities);
        setIsLoading(false);
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws, navigate]);

  const toggleEntity = (entityId: string) => {
    setSelectedEntities(prev => 
      prev.includes(entityId)
        ? prev.filter(id => id !== entityId)
        : [...prev, entityId]
    );
  };

  const toggleAll = () => {
    setSelectedEntities(prev => 
      prev.length === entities.length
        ? []
        : entities.map(e => e.entity_id)
    );
  };

  const handleConfirm = () => {
    if (selectedEntities.length === 0) {
      toast.error('Please select at least one device');
      return;
    }

    localStorage.setItem('selected_entities', JSON.stringify(selectedEntities));
    navigate('/display');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 animated-gradient backdrop-blur">
      <div className="max-w-3xl mx-auto bg-white/5 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Select Devices</h2>
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>

        <div className="space-y-2 mb-6">
          {entities.map(entity => (
            <div
              key={entity.entity_id}
              onClick={() => toggleEntity(entity.entity_id)}
              className="flex items-center p-4 bg-black/20 rounded-lg cursor-pointer hover:bg-black/30 transition-colors"
            >
              {selectedEntities.includes(entity.entity_id) ? (
                <CheckSquare className="w-5 h-5 text-white/80 mr-3" />
              ) : (
                <Square className="w-5 h-5 text-gray-400 mr-3" />
              )}
              <span className="flex-1">
                {entity.attributes.friendly_name || entity.entity_id}
              </span>
              <span className="text-sm text-gray-400">
                {entity.entity_id}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={handleConfirm}
          className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-lg font-semibold transition-colors backdrop-blur-sm"
        >
          Confirm Selection ({selectedEntities.length})
        </button>
      </div>
    </div>
  );
}