from typing import Dict, Any, Optional
from backend.app.models.environmental import EnvironmentalContext

class ConversationMemory:
    def __init__(self):
        self.sessions: Dict[str, EnvironmentalContext] = {}
        self.message_history: Dict[str, list] = {}

    def get_or_create(self, session_id: str = "default") -> EnvironmentalContext:
        if session_id not in self.sessions:
            self.sessions[session_id] = EnvironmentalContext()
            self.message_history[session_id] = []
        return self.sessions[session_id]

    def update_context(self, session_id: str, new_data: Dict[str, Any]) -> EnvironmentalContext:
        context = self.get_or_create(session_id)
        
        # Deep merge updates
        for section, fields in new_data.items():
            if hasattr(context, section) and isinstance(fields, dict):
                sec_obj = getattr(context, section)
                for k, v in fields.items():
                    if v is not None and hasattr(sec_obj, k):
                        setattr(sec_obj, k, v)
        return context

    def add_message(self, session_id: str, role: str, text: str, extra: Optional[Dict[str, Any]] = None):
        self.get_or_create(session_id)
        msg = {"role": role, "text": text}
        if extra:
            msg.update(extra)
        self.message_history[session_id].append(msg)

    def get_history(self, session_id: str = "default") -> list:
        return self.message_history.get(session_id, [])

    def reset(self, session_id: str = "default"):
        if session_id in self.sessions:
            del self.sessions[session_id]
        if session_id in self.message_history:
            del self.message_history[session_id]
