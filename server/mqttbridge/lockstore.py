import threading

class LastStore:
    _instance = None
    _lock = threading.Lock()

    def __init__(self):
        self._data = {}
        self._data_lock = threading.Lock()

    @classmethod
    def get_instance(cls):
        if not cls._instance:
            with cls._lock:
                if not cls._instance:
                    cls._instance = cls()
        return cls._instance

    def set(self, key, value):
        with self._data_lock:
            self._data[key] = value

    def get(self, key):
        with self._data_lock:
            return self._data.get(key)
