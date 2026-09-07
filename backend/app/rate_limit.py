import time
from typing import Dict, Optional

MAX_INTENTOS = 5
BLOQUEO_SEGUNDOS = 15 * 60


class _Estado:
    __slots__ = ("fallos", "bloqueado_hasta")

    def __init__(self):
        self.fallos = 0
        self.bloqueado_hasta: Optional[float] = None


class LoginRateLimiter:
    """Bloquea intentos de login por email (no por IP): si se bloqueara por
    IP, un empleado que se equivoca la contraseña dejaría afuera a todo el
    local si comparten la misma conexión de internet.

    Vive en memoria del proceso: alcanza porque el backend corre en una
    sola instancia (plan free de Render). Si en algún momento se escala a
    varias instancias, esto hay que pasarlo a un store compartido (ej.
    Redis), porque cada instancia tendría su propio conteo.
    """

    def __init__(self):
        self._estados: Dict[str, _Estado] = {}

    def segundos_restantes_bloqueo(self, email: str) -> int:
        estado = self._estados.get(email)
        if estado is None or estado.bloqueado_hasta is None:
            return 0
        restante = estado.bloqueado_hasta - time.monotonic()
        if restante <= 0:
            del self._estados[email]
            return 0
        return int(restante)

    def registrar_fallo(self, email: str) -> None:
        estado = self._estados.setdefault(email, _Estado())
        estado.fallos += 1
        if estado.fallos >= MAX_INTENTOS:
            estado.bloqueado_hasta = time.monotonic() + BLOQUEO_SEGUNDOS

    def registrar_exito(self, email: str) -> None:
        self._estados.pop(email, None)


login_rate_limiter = LoginRateLimiter()
