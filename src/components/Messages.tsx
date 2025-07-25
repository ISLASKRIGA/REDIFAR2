import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Search, MessageCircle, Users, Clock, CheckCircle2, Circle, Plus, ArrowRightLeft, CheckCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useHospitals } from '../hooks/useHospitals';
import { useMessages } from '../hooks/useMessages';
import { useHospitalColor } from '../hooks/useHospitalColor';
import { supabase } from '../lib/supabase'; // o la ruta correcta donde esté tu instancia de Supabase

interface TransferAgreement {
  id: string;
  fromHospitalId: string;
  toHospitalId: string;
  medicationName: string;
  quantity: number;
  status: 'pending' | 'agreed' | 'completed';
  agreedByFrom: boolean;
  agreedByTo: boolean;
  createdAt: string;
}


export const Messages: React.FC = () => {
  const { user } = useAuth();
  const { hospitals } = useHospitals();
  const [selectedHospital, setSelectedHospital] = useState<string | null>(null);
  const [lastActiveHospital, setLastActiveHospital] = useState<string | null>(null);
  const [hospitalOrder, setHospitalOrder] = useState<string[]>([]);
  const [lastProcessedMessageId, setLastProcessedMessageId] = useState<string | null>(null);
const isProcessingExternalMessage = useRef(false);


  
  const otherHospitals = (hospitals || []).filter(h => h.user_id !== user?.id);

  const {
    messages, 
    loading, 
    messagesLoading,
    sendMessage, 
    markAsRead,
    fetchMessages,
    currentHospital,
  } = useMessages(selectedHospital);

    // Mapeo para saber cuándo fue el último mensaje de cada hospital
  const [hospitalLastMessageMap, setHospitalLastMessageMap] = useState<Record<string, string>>({});
  const [unreadMap, setUnreadMap] = useState<Record<string, boolean>>({});

useEffect(() => {
  const loadOrder = () => {
    try {
      const savedOrder = localStorage.getItem('conversationOrder');
      if (savedOrder) {
        setHospitalOrder(JSON.parse(savedOrder));
      }
    } catch (e) {
      console.error('Error parsing saved conversation order');
    }
  };

  loadOrder();

  window.addEventListener('conversationOrderUpdated', loadOrder);

  return () => {
    window.removeEventListener('conversationOrderUpdated', loadOrder);
  };
}, []);
  useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      const updated = JSON.parse(localStorage.getItem('conversationOrder') || '[]');
      setHospitalOrder(updated);
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, []);


  // 🔁 Escuchar cambios de orden desde MessageListener
useEffect(() => {
  const handleUpdate = () => {
    const updated = JSON.parse(localStorage.getItem('conversationOrder') || '[]');
    setHospitalOrder(updated);
  };

  window.addEventListener('conversationOrderUpdated', handleUpdate);

  return () => {
    window.removeEventListener('conversationOrderUpdated', handleUpdate);
  };
}, []);
  // ✅ Cargar orden de conversaciones al montar el componente
useEffect(() => {
  const updated = JSON.parse(localStorage.getItem('conversationOrder') || '[]');
  setHospitalOrder(updated);
}, []);

  
  // ✅ Cargar orden de conversaciones al montar el componente
useEffect(() => {
  const updated = JSON.parse(localStorage.getItem('conversationOrder') || '[]');
  setHospitalOrder(updated);
}, []);


useEffect(() => {
  if (!currentHospital || messages.length === 0) return;

  const lastMessage = messages[messages.length - 1];

  if (!lastMessage || lastMessage.id === lastProcessedMessageId) return;

  const partnerId =
    lastMessage.sender_hospital_id === currentHospital.id
      ? lastMessage.recipient_hospital_id
      : lastMessage.sender_hospital_id;
lastMessagesMap[partnerId] = lastMessage.content;

  // ✅ SOLO SI ES UN MENSAJE RECIBIDO DE OTRA CONVERSACIÓN
  if (
    partnerId !== selectedHospital && 
    lastMessage.sender_hospital_id !== currentHospital.id
  ) {
    setLastProcessedMessageId(lastMessage.id);
    setUnreadMap((prev) => ({ ...prev, [partnerId]: true }));

    setHospitalOrder((prevOrder) => {
      const newOrder = [partnerId, ...prevOrder.filter((id) => id !== partnerId)];
      localStorage.setItem('conversationOrder', JSON.stringify(newOrder));
      return newOrder;
    });
  }
}, [messages, selectedHospital, currentHospital, lastProcessedMessageId]);


  
  const hospitalColor = useHospitalColor(currentHospital?.id);
  
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [transferAgreements, setTransferAgreements] = useState<TransferAgreement[]>([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({
    medicationName: '',
    quantity: 0,
    recipientHospitalId: ''
  });

  const scrollToBottom = () => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
};


  useEffect(() => {
  // Evita scroll si no hay mensajes o no se ha seleccionado un hospital
  if (!selectedHospital || messages.length === 0) return;

  // Hacemos scroll directo sin animación
  scrollToBottom();
}, [messages, selectedHospital]);



  // Load messages when conversation is selected
  useEffect(() => {
  if (!selectedHospital) return;

  const fetchAndMark = async () => {
    markAsRead();
    window.location.hash = selectedHospital;

    isProcessingExternalMessage.current = false;

    await fetchMessages(selectedHospital);

    // 👇 🔁 Carga el orden actualizado del localStorage (por si cambió fuera de Messages.tsx)
    const updated = JSON.parse(localStorage.getItem('conversationOrder') || '[]');
    setHospitalOrder(updated);
  };

  fetchAndMark();
}, [selectedHospital]);






  // Verificar si hay información de contacto pendiente
 useEffect(() => {
  const contactInfo = localStorage.getItem('contactHospital');

  if (!contactInfo || !currentHospital) return;

  try {
    const { hospitalId, subject } = JSON.parse(contactInfo);

    // Solo si aún no se había enviado (evita doble envío)
    if (hospitalId && subject) {
      setSelectedHospital(hospitalId);

      const autoMessage = `Hola, me interesa contactarte sobre: ${subject}`;

      sendMessage({
        sender_hospital_id: currentHospital.id,
        recipient_hospital_id: hospitalId,
        content: autoMessage,
        message_type: 'text'
      });

      localStorage.removeItem('contactHospital'); // ✅ Elimínalo al instante
    }
  } catch (error) {
    console.error('Error parsing contact info:', error);
  }
}, [currentHospital]);


 const filteredHospitals = otherHospitals
  .filter(hospital =>
    hospital.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  .sort((a, b) => {
    const aIndex = hospitalOrder.indexOf(a.id);
    const bIndex = hospitalOrder.indexOf(b.id);

    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });






  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedHospital || !currentHospital || sendingMessage || isSubmitting) return;

    setSendingMessage(true);
    setIsSubmitting(true);
    
    try {
      setMessageText('');
      setTimeout(scrollToBottom, 50);
      
      const { error } = await sendMessage({
        sender_hospital_id: currentHospital.id,
        recipient_hospital_id: selectedHospital,
        content: messageText.trim(),
        message_type: 'text'
      });

      if (error) {
        setMessageText(messageText.trim());
      }
      
      // Refresh messages after sending
   if (!error && selectedHospital) {
  setHospitalOrder((prevOrder) => {
    const newOrder = [selectedHospital, ...prevOrder.filter(id => id !== selectedHospital)];
    localStorage.setItem('conversationOrder', JSON.stringify(newOrder));
    return newOrder;
  });
}



    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
      setIsSubmitting(false);
    }
  }, [messageText, selectedHospital, currentHospital, sendMessage, sendingMessage, isSubmitting, fetchMessages]);

  const handleProposeTransfer = useCallback(() => {
    setShowTransferModal(true);
    setTransferData({
      ...transferData,
      recipientHospitalId: selectedHospital || ''
    });
  }, [selectedHospital, transferData]);

  const handleCreateTransfer = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentHospital || !selectedHospital || !transferData.medicationName || !transferData.quantity) return;

    const newTransfer: TransferAgreement = {
      id: `transfer-${Date.now()}`,
      fromHospitalId: currentHospital.id,
      toHospitalId: selectedHospital,
      medicationName: transferData.medicationName,
      quantity: transferData.quantity,
      status: 'pending',
      agreedByFrom: true, // El que propone ya está de acuerdo
      agreedByTo: false,
      createdAt: new Date().toISOString()
    };

    setTransferAgreements(prev => [...prev, newTransfer]);

    // Enviar mensaje sobre la transferencia
    const transferMessage = `🔄 PROPUESTA DE TRANSFERENCIA\n\nMedicamento: ${transferData.medicationName}\nCantidad: ${transferData.quantity} unidades\n\n¿Estás de acuerdo con esta transferencia? Responde "ACEPTO" para confirmar.`;
    
    await sendMessage({
      sender_hospital_id: currentHospital.id,
      recipient_hospital_id: selectedHospital,
      content: transferMessage,
      message_type: 'text'
    });

    setShowTransferModal(false);
    setTransferData({ medicationName: '', quantity: 0, recipientHospitalId: '' });
  }, [currentHospital, selectedHospital, transferData, sendMessage]);

  const handleAgreeToTransfer = useCallback(async (transferId: string) => {
    setTransferAgreements(prev => 
      prev.map(transfer => 
        transfer.id === transferId 
          ? { ...transfer, agreedByTo: true, status: 'agreed' }
          : transfer
      )
    );

    // Enviar mensaje de confirmación
    if (currentHospital && selectedHospital) {
      await sendMessage({
        sender_hospital_id: currentHospital.id,
        recipient_hospital_id: selectedHospital,
        content: "✅ ACEPTO la transferencia propuesta. La transferencia está ahora confirmada y puede proceder.",
        message_type: 'text'
      });
    }
  }, [currentHospital, selectedHospital, sendMessage]);

  // Verificar si hay transferencias pendientes para el hospital actual
  const pendingTransfers = transferAgreements.filter(transfer => 
    transfer.toHospitalId === currentHospital?.id && 
    transfer.fromHospitalId === selectedHospital &&
    !transfer.agreedByTo
  );

  const agreedTransfers = transferAgreements.filter(transfer => 
    (transfer.fromHospitalId === currentHospital?.id || transfer.toHospitalId === currentHospital?.id) &&
    (transfer.fromHospitalId === selectedHospital || transfer.toHospitalId === selectedHospital) &&
    transfer.agreedByFrom && transfer.agreedByTo
  );

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    }
  };

  const getHospitalInitials = (name: string) => {
    return name.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  // Diccionario con el último mensaje por hospital
const lastMessagesMap: { [hospitalId: string]: string } = {};

messages.slice().reverse().forEach((msg) => {
  const otherId =
    msg.sender_hospital_id === currentHospital?.id
      ? msg.recipient_hospital_id
      : msg.sender_hospital_id;

  if (!lastMessagesMap[otherId]) {
    lastMessagesMap[otherId] = msg.content;
  }
});


  return (
    <div className="h-[calc(100vh-6rem)] sm:h-[calc(100vh-8rem)] flex flex-col lg:flex-row bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Sidebar - Hospitals List */}
      <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col max-h-64 lg:max-h-none">
        {/* Header */}
        <div className={`p-3 sm:p-4 bg-gradient-to-r ${hospitalColor.gradient} text-white`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-bold flex items-center">
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Red Hospitalaria
            </h2>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar hospitales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 focus:bg-white/30 focus:outline-none text-sm"
            />
          </div>
        </div>

        {/* Hospitals List */}
        <div className="flex-1 overflow-y-auto">
          {filteredHospitals.length === 0 ? (
            <div className="p-4 sm:p-6 text-center text-gray-500">
              <MessageCircle className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No hay hospitales</p>
              <p className="text-xs sm:text-sm mt-1">No se encontraron hospitales en la red</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredHospitals.map((hospital) => {
                const isSelected = selectedHospital === hospital.id;
                
                return (
                  <div
                    key={hospital.id}
                    onClick={() => {
  setSelectedHospital(hospital.id);
  setUnreadMap(prev => ({ ...prev, [hospital.id]: false }));
}}

                    className={`p-3 sm:p-4 cursor-pointer transition-colors ${
                      isSelected 
                        ? `${hospitalColor.light} ${hospitalColor.text}` 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm ${hospitalColor.primary}`}>
                        {getHospitalInitials(hospital.name)}
                      </div>
                      {unreadMap[hospital.id] && (
  <div
    className={`w-2 h-2 rounded-full ml-1 mt-0.5 ${hospitalColor.primary}`}
    title="Nuevo mensaje"
  />
)}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-sm sm:text-base font-medium text-gray-900 truncate">
                              {hospital.name}
                            </h3>
                            <p className="text-xs text-gray-500 truncate mt-0.5">
  {lastMessagesMap[hospital.id] || ''}
</p>

                            <p className="text-xs text-gray-500 mt-1 hidden sm:block">
                              {hospital.city}, {hospital.state}
                            </p>
                          </div>
                          <div className="text-right hidden sm:block">
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                              {hospital.type === 'public' ? 'Público' : 
                               hospital.type === 'private' ? 'Privado' : 'Universitario'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 sm:hidden">
                          <div className="flex items-center text-xs text-gray-500">
                            <span>{hospital.city}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <span>💬 Chat</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {selectedHospital ? (
          <>
            {(() => {
              const hospital = otherHospitals.find(h => h.id === selectedHospital);
              return (
            <>
            {/* Chat Header */}
            <div className="p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm ${hospitalColor.primary}`}>
                    {getHospitalInitials(hospital?.name || 'Hospital')}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                      {hospital?.name || 'Hospital'}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {hospital?.city}, {hospital?.state}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  {agreedTransfers.length > 0 && (
                    <div className="flex items-center space-x-1 px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm">
                      <CheckCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">{agreedTransfers.length} transferencia(s) activa(s)</span>
                      <span className="sm:hidden">{agreedTransfers.length}</span>
                    </div>
                  )}
                  <button
                    onClick={handleProposeTransfer}
                    className={`px-2 sm:px-3 py-1 bg-gradient-to-r ${hospitalColor.gradient} text-white rounded-lg hover:opacity-90 transition-all text-xs sm:text-sm flex items-center space-x-1`}
                  >
                    <ArrowRightLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Proponer Transferencia</span>
                    <span className="sm:hidden">Transfer</span>
                  </button>
                </div>
              </div>
              
              {/* Transferencias pendientes */}
              {pendingTransfers.length > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">Transferencias Pendientes de Aprobación:</h4>
                  {pendingTransfers.map(transfer => (
                    <div key={transfer.id} className="flex items-center justify-between bg-white p-2 rounded border">
                      <div>
                        <p className="text-sm font-medium">{transfer.medicationName}</p>
                        <p className="text-xs text-gray-600">{transfer.quantity} unidades</p>
                      </div>
                      <button
                        onClick={() => handleAgreeToTransfer(transfer.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        Aceptar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </>
              );
            })()}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-4 bg-gray-50" style={{ minHeight: 0 }}>
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <MessageCircle className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No hay mensajes</p>
                    <p className="text-xs sm:text-sm mt-1">Envía el primer mensaje para comenzar la conversación</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = message.sender_hospital_id === currentHospital?.id;
                  const isOptimistic = message.id.startsWith('temp-');
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} px-1 sm:px-0`}
                    >
                      <div className={`max-w-xs sm:max-w-sm lg:max-w-md px-3 sm:px-4 py-2 rounded-lg shadow-sm transition-opacity ${
                        isOwn 
                          ? `bg-gradient-to-r ${hospitalColor.gradient} text-white` 
                          : 'bg-white text-gray-900 border border-gray-200'
                      } ${isOptimistic ? 'opacity-70' : 'opacity-100'}`}>
                        {!isOwn && (
                          <p className="text-xs font-medium mb-1 opacity-70 hidden sm:block">
                            {message.sender_hospital?.name || 'Hospital'}
                          </p>
                        )}
                        <p className="text-xs sm:text-sm leading-relaxed">{message.content}</p>
                        <div className={`flex items-center justify-end mt-1 space-x-1 ${
                          isOwn ? 'text-white/70' : 'text-gray-500'
                        }`}>
                          <span className="text-xs">
                            {formatTime(message.created_at)}
                          </span>
                          {isOwn && !isOptimistic && (
                            message.read_at ? 
                              <CheckCircle2 className="w-3 h-3" title="Leído" /> : 
                              <Circle className="w-3 h-3" title="Enviado" />
                          )}
                          {isOptimistic && (
                            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" title="Enviando..." />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-2 sm:p-4 border-t border-gray-200 bg-white">
              <div className="flex space-x-1 sm:space-x-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  disabled={sendingMessage || isSubmitting}
                  autoComplete="off"
                  className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-sm"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim() || sendingMessage || isSubmitting}
                  className={`px-3 sm:px-4 py-2 bg-gradient-to-r ${hospitalColor.gradient} text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 sm:space-x-2`}
                >
                  {sendingMessage || isSubmitting ? (
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                  )}
                  {!sendingMessage && !isSubmitting && <span className="hidden md:inline text-sm">Enviar</span>}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Selecciona un hospital
              </h3>
              <p className="text-sm mb-4">
                Elige un hospital de la red para comenzar a chatear
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Proponer Transferencia</h3>
              <p className="text-gray-600 mb-6">
                Propón una transferencia de medicamento a {otherHospitals.find(h => h.id === selectedHospital)?.name}
              </p>
              
              <form onSubmit={handleCreateTransfer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medicamento
                  </label>
                  <input
                    type="text"
                    value={transferData.medicationName}
                    onChange={(e) => setTransferData({ ...transferData, medicationName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nombre del medicamento"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    value={transferData.quantity}
                    onChange={(e) => setTransferData({ ...transferData, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Cantidad a transferir"
                    min="1"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`px-6 py-2 bg-gradient-to-r ${hospitalColor.gradient} text-white rounded-lg hover:opacity-90 transition-all`}
                  >
                    Proponer Transferencia
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};