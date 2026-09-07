from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, balance, categorias, config_medio_pago, gastos, productos, proveedores, ventas

app = FastAPI(title="Stock Local API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(categorias.router)
app.include_router(proveedores.router)
app.include_router(productos.router)
app.include_router(config_medio_pago.router)
app.include_router(ventas.router)
app.include_router(gastos.router)
app.include_router(gastos.router_categorias)
app.include_router(balance.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
