er space-x-1`}
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
            <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-4 bg-gray-50 lg:bg-white" style={{ minHeight: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23f0f0f0" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}}>
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
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} px-1 sm:px-0 animate-fadeIn`}
                    >
                      <div className={`max-w-xs sm:max-w-sm lg:max-w-md px-3 sm:px-4 py-2 shadow-sm transition-opacity ${
                        isOwn 
                          ? `bg-gradient-to-r ${hospitalColor.gradient} text-white rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-md` 
                          : 'bg-white text-gray-900 border border-gray-200 rounded-tl-md rounded-tr-2xl rounded-bl-2xl rounded-br-2xl'
                      } ${isOptimistic ? 'opacity-70' : 'opacity-100'}`}>
                        {!isOwn && (
                          <p className="text-xs font-medium mb-1 opacity-70 hidden lg:block">
                            {message.sender_hospital?.name || 'Hospital'}
                          </p>
                        )}
                        <p className="text-sm leading-relaxed">{message.content}</p>
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
            <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-gray-200 bg-white">
              <div className="flex items-end space-x-2 sm:space-x-3">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Escribe un mensaje"
                  disabled={sendingMessage || isSubmitting}
                  autoComplete="off"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-sm bg-gray-50 resize-none max-h-20"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim() || sendingMessage || isSubmitting}
                  className={`w-12 h-12 bg-gradient-to-r ${hospitalColor.gradient} text-white rounded-full hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg`}
                >
                  {sendingMessage || isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50 lg:bg-white">
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