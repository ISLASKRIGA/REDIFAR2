/*
  # Sistema de Mensajería entre Hospitales

  1. Nuevas Tablas
    - `conversations` - Conversaciones entre hospitales
    - `conversation_participants` - Participantes en conversaciones
    - `messages` - Mensajes individuales

  2. Seguridad
    - Habilitar RLS en todas las tablas
    - Políticas para que hospitales solo vean sus conversaciones
    - Políticas para envío y lectura de mensajes

  3. Funcionalidades
    - Conversaciones directas entre hospitales
    - Mensajes en tiempo real
    - Estado de lectura de mensajes
    - Historial de conversaciones
*/

-- Tabla de conversaciones
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_type text NOT NULL CHECK (conversation_type IN ('direct', 'group')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_message text,
  last_message_at timestamptz DEFAULT now()
);

-- Tabla de participantes en conversaciones
CREATE TABLE IF NOT EXISTS conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  hospital_id uuid REFERENCES hospitals(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(conversation_id, hospital_id)
);

-- Tabla de mensajes
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  sender_hospital_id uuid REFERENCES hospitals(id) ON DELETE CASCADE,
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
  created_at timestamptz DEFAULT now(),
  read_at timestamptz,
  edited_at timestamptz
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_hospital ON conversation_participants(hospital_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_hospital_id);

-- Habilitar RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Políticas para conversations
CREATE POLICY "Users can read conversations they participate in"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      JOIN hospitals h ON h.id = cp.hospital_id
      WHERE cp.conversation_id = conversations.id
      AND h.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update conversations they participate in"
  ON conversations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      JOIN hospitals h ON h.id = cp.hospital_id
      WHERE cp.conversation_id = conversations.id
      AND h.user_id = auth.uid()
    )
  );

-- Políticas para conversation_participants
CREATE POLICY "Users can read participants of their conversations"
  ON conversation_participants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hospitals h
      WHERE h.id = conversation_participants.hospital_id
      AND h.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM conversation_participants cp2
      JOIN hospitals h ON h.id = cp2.hospital_id
      WHERE cp2.conversation_id = conversation_participants.conversation_id
      AND h.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add participants to conversations they're in"
  ON conversation_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      JOIN hospitals h ON h.id = cp.hospital_id
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND h.user_id = auth.uid()
    )
  );

-- Políticas para messages
CREATE POLICY "Users can read messages from their conversations"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      JOIN hospitals h ON h.id = cp.hospital_id
      WHERE cp.conversation_id = messages.conversation_id
      AND h.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their conversations"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hospitals h
      WHERE h.id = messages.sender_hospital_id
      AND h.user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      JOIN hospitals h ON h.id = cp.hospital_id
      WHERE cp.conversation_id = messages.conversation_id
      AND h.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hospitals h
      WHERE h.id = messages.sender_hospital_id
      AND h.user_id = auth.uid()
    )
  );

-- Función para crear conversaciones automáticamente
CREATE OR REPLACE FUNCTION create_conversation_with_participants(
  p_conversation_type text,
  p_hospital_ids uuid[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id uuid;
  v_hospital_id uuid;
BEGIN
  -- Crear la conversación
  INSERT INTO conversations (conversation_type)
  VALUES (p_conversation_type)
  RETURNING id INTO v_conversation_id;
  
  -- Agregar participantes
  FOREACH v_hospital_id IN ARRAY p_hospital_ids
  LOOP
    INSERT INTO conversation_participants (conversation_id, hospital_id)
    VALUES (v_conversation_id, v_hospital_id);
  END LOOP;
  
  RETURN v_conversation_id;
END;
$$;

-- Función para actualizar last_message automáticamente
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message = NEW.content,
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$;

-- Trigger para actualizar last_message
CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();