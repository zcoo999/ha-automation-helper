import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, LogOut, Power, Sun, Thermometer } from 'lucide-react';

interface Entity {
  entity_id: string;
  state: string;
  attributes: {
    friendly_name?: string;
    brightness?: number;
    color_temp?: number;
    min_mireds?: number;
    max_mireds?: number;
  };
}

export default function Display() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const navigate = useNavigate();
  const { ws, logout } = useAuth();

  useEffect(() => {
    if (!ws) {
      navigate('/login');
      return;
    }

    const handleOpen = () => setWsStatus('connected');
    const handleClose = () => setWsStatus('disconnected');

    ws.addEventListener('open', handleOpen);
    ws.addEventListener('close', handleClose);

    setWsStatus(ws.readyState === WebSocket.OPEN ? 'connected' : 'disconnected');

    const selectedEntities = JSON.parse(localStorage.getItem('selected_entities') || '[]');
    if (!selectedEntities.length) {
      navigate('/select');
      return;
    }

    const msgId = Date.now();
    ws.send(JSON.stringify({
      id: msgId,
      type: "get_states"
    }));

    ws.send(JSON.stringify({
      id: msgId + 1,
      type: "subscribe_events",
      event_type: "state_changed"
    }));

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "result" && data.success && data.result) {
        const filteredEntities = data.result.filter((entity: Entity) => 
          selectedEntities.includes(entity.entity_id)
        );
        setEntities(filteredEntities);
        setIsLoading(false);
      }

      if (data.type === "event" && data.event.event_type === "state_changed") {
        const { entity_id, new_state } = data.event.data;
        if (selectedEntities.includes(entity_id)) {
          setEntities(prev => prev.map(entity => 
            entity.entity_id === entity_id ? new_state : entity
          ));
        }
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => {
      ws.removeEventListener('open', handleOpen);
      ws.removeEventListener('close', handleClose);
      ws.removeEventListener('message', handleMessage);
    };
  }, [ws, navigate]);

  const handleToggle = (entityId: string, currentState: string) => {
    const msgId = Date.now();
    ws.send(JSON.stringify({
      id: msgId,
      type: "call_service",
      domain: "light",
      service: currentState === 'on' ? "turn_off" : "turn_on",
      target: {
        entity_id: entityId
      }
    }));
  };

  const handleBrightnessChange = (entityId: string, value: number) => {
    const brightness = Math.min(100, Math.max(0, value));
    const msgId = Date.now();
    ws.send(JSON.stringify({
      id: msgId,
      type: "call_service",
      domain: "light",
      service: "turn_on",
      target: {
        entity_id: entityId
      },
      service_data: {
        brightness: Math.round(brightness * 255 / 100)
      }
    }));
  };

  const handleColorTempChange = (entityId: string, kelvin: number) => {
    const limitedKelvin = Math.min(6500, Math.max(2500, kelvin));
    const mireds = Math.round(1000000 / limitedKelvin);
    const msgId = Date.now();
    ws.send(JSON.stringify({
      id: msgId,
      type: "call_service",
      domain: "light",
      service: "turn_on",
      target: {
        entity_id: entityId
      },
      service_data: {
        color_temp: mireds
      }
    }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center animated-gradient backdrop-blur">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/60 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 animated-gradient backdrop-blur">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/select')}
              className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white shadow-lg backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </button>
            <h2 className="text-2xl font-bold text-white">Entity Control</h2>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full ${
              wsStatus === 'connected' 
                ? 'bg-green-500/10 text-green-400' 
                : 'bg-red-500/10 text-red-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                wsStatus === 'connected' 
                  ? 'bg-green-400 animate-pulse' 
                  : 'bg-red-400'
              }`} />
              <span className="text-sm">
                {wsStatus === 'connected' ? '已连接' : '已断开'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-white shadow-lg"
            >
              <LogOut className="w-4 h-4 mr-2" />
              LogOut
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {entities.map(entity => {
            const isOn = entity.state === 'on';
            const brightness = entity.attributes.brightness
              ? Math.round(entity.attributes.brightness / 255 * 100)
              : 0;
            
            const colorTemp = entity.attributes.color_temp
              ? (entity.attributes.color_temp < 1000 
                  ? Math.round(1000000 / entity.attributes.color_temp)
                  : Math.round(entity.attributes.color_temp))
              : 2500;
            
            const minKelvin = 2500;
            const maxKelvin = 6500;

            return (
              <div
                key={entity.entity_id}
                className="bg-white/5 backdrop-blur-xl rounded-xl p-6 shadow-lg transition-all duration-200 hover:shadow-xl border border-white/10"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {entity.attributes.friendly_name || entity.entity_id}
                    </h3>
                    <p className="text-sm text-gray-300">{entity.entity_id}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(entity.entity_id, entity.state)}
                    className={`p-3 rounded-lg transition-colors shadow-md ${
                      isOn
                        ? 'bg-white/20 hover:bg-white/30 text-white'
                        : 'bg-gray-800/50 hover:bg-gray-700/50 text-white'
                    } backdrop-blur-sm`}
                  >
                    <Power className="w-5 h-5" />
                  </button>
                </div>

                {isOn && (
                  <div className="space-y-6">
                    {entity.attributes.brightness !== undefined && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-gray-200">
                          <span className="flex items-center">
                            <Sun className="w-4 h-4 mr-2" />
                            亮度
                          </span>
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={brightness}
                              onChange={(e) => handleBrightnessChange(
                                entity.entity_id,
                                parseInt(e.target.value)
                              )}
                              className="w-16 px-2 py-1 text-right bg-black/20 border border-gray-600 rounded-md text-white"
                            />
                            <span>%</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={brightness}
                          onChange={(e) => handleBrightnessChange(
                            entity.entity_id,
                            parseInt(e.target.value)
                          )}
                          className="w-full h-2 bg-black/20 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    )}

                    {entity.attributes.color_temp !== undefined && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-gray-200">
                          <span className="flex items-center">
                            <Thermometer className="w-4 h-4 mr-2" />
                            色温
                          </span>
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min={minKelvin}
                              max={maxKelvin}
                              value={colorTemp}
                              onChange={(e) => handleColorTempChange(
                                entity.entity_id,
                                parseInt(e.target.value)
                              )}
                              className="w-16 px-2 py-1 text-right bg-black/20 border border-gray-600 rounded-md text-white"
                            />
                            <span>K</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={minKelvin}
                          max={maxKelvin}
                          value={colorTemp}
                          onChange={(e) => handleColorTempChange(
                            entity.entity_id,
                            parseInt(e.target.value)
                          )}
                          className="w-full h-2 bg-black/20 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}