"""Crea un usuario para poder loguearse en la app. Correr a mano:

    python3 seed_usuario.py

No hay endpoint HTTP de registro a propósito (ver CLAUDE.md / plan): en un
local con pocas personas, un alta pública de cuentas es una puerta de
entrada innecesaria. Este script se corre localmente o contra la base de
producción (exportando DATABASE_URL antes) cada vez que hay que dar de alta
un usuario nuevo.
"""
import asyncio
import getpass

from sqlalchemy import select

from app.database import Base, SessionLocal, engine
from app.models.usuario import Usuario
from app.security import hash_password


async def main():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    email = input("Email: ").strip().lower()
    nombre = input("Nombre: ").strip()
    password = getpass.getpass("Contraseña: ")

    async with SessionLocal() as db:
        existente = await db.execute(select(Usuario).where(Usuario.email == email))
        if existente.scalar_one_or_none() is not None:
            print(f"Ya existe un usuario con el email {email}.")
            return

        usuario = Usuario(email=email, nombre=nombre, password_hash=hash_password(password))
        db.add(usuario)
        await db.commit()
        print(f"Usuario '{email}' creado correctamente.")


if __name__ == "__main__":
    asyncio.run(main())
